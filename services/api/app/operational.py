import json
import unicodedata
from functools import lru_cache
from urllib.request import Request, urlopen

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import create_engine, text
from .main import settings

router = APIRouter(prefix="/v1", tags=["territorial"])
engine = create_engine(settings.database_url, pool_pre_ping=True)


def parse_bbox(bbox: str):
    try:
        values = [float(v) for v in bbox.split(",")]
    except ValueError:
        raise HTTPException(422, "bbox must contain numbers")
    if len(values) != 4 or not (-180 <= values[0] < values[2] <= 180 and -90 <= values[1] < values[3] <= 90):
        raise HTTPException(422, "invalid bbox")
    return dict(w=values[0], s=values[1], e=values[2], n=values[3])


@router.get("/territory/properties")
def territory_properties(bbox: str, limit: int = Query(300, ge=1, le=500)):
    params = parse_bbox(bbox)
    params["limit"] = limit
    with engine.connect() as conn:
        rows = conn.execute(text("""SELECT id, source, external_id, name, state_code, municipality_code,
          area_hectares, ST_AsGeoJSON(ST_Transform(geometry,4326)) AS geometry
          FROM rural_properties
          WHERE geometry IS NOT NULL AND ST_Intersects(
            geometry, ST_Transform(ST_MakeEnvelope(:w,:s,:e,:n,4326),4674))
          ORDER BY id LIMIT :limit"""), params).mappings().all()
    return {"type":"FeatureCollection","features":[{"type":"Feature","id":r["id"],
      "geometry":json.loads(r["geometry"]),"properties":{k: str(r[k]) if k=="area_hectares" and r[k] is not None else r[k]
      for k in ("source","external_id","name","state_code","municipality_code","area_hectares")}} for r in rows]}


@router.get("/territory/embargoes")
def territory_embargoes(bbox: str, limit: int = Query(300, ge=1, le=500)):
    params = parse_bbox(bbox)
    params["limit"] = limit
    with engine.connect() as conn:
        rows = conn.execute(text("""SELECT source, external_id, restriction_type, status, reference_date,
          ST_AsGeoJSON(ST_Transform(geometry,4326)) AS geometry
          FROM environmental_restrictions WHERE restriction_type='embargo'
          AND ST_Intersects(geometry,ST_Transform(ST_MakeEnvelope(:w,:s,:e,:n,4326),4674))
          LIMIT :limit"""),params).mappings().all()
    return {"type":"FeatureCollection","features":[{"type":"Feature","geometry":json.loads(r["geometry"]),
     "properties":{"source":r["source"],"external_id":r["external_id"],"type":r["restriction_type"],
       "status":r["status"],"reference_date":str(r["reference_date"]) if r["reference_date"] else None}} for r in rows]}


@lru_cache(maxsize=1)
def municipalities():
    request = Request("https://servicodados.ibge.gov.br/api/v1/localidades/municipios",
                      headers={"User-Agent":"LiberatoFazendas/0.1 (+official public datasets)"})
    with urlopen(request,timeout=20) as response:
        data=json.load(response)
    return [{"id":x["id"],"name":x["nome"],
      "uf":x["microrregiao"]["mesorregiao"]["UF"]["sigla"]} for x in data]


def normalize(text_value):
    return "".join(c for c in unicodedata.normalize("NFD",text_value.casefold()) if unicodedata.category(c)!="Mn")


@router.get("/municipalities")
def search_municipalities(q: str=Query(min_length=2,max_length=90), limit: int=Query(15,ge=1,le=30)):
    try:
        matches=[v for v in municipalities() if normalize(q) in normalize(v["name"]) or normalize(q)==normalize(v["name"]+" "+v["uf"])]
        return {"source":"IBGE - API Localidades","results":matches[:limit]}
    except Exception:
        raise HTTPException(503,"IBGE temporarily unavailable")


@router.get("/properties/{property_id}/environment")
def property_environment(property_id:int):
    with engine.connect() as conn:
        result=conn.execute(text("""SELECT p.id, p.source, p.external_id,
           COUNT(r.id) FILTER (WHERE r.restriction_type='embargo') AS matches
           FROM rural_properties p LEFT JOIN environmental_restrictions r
           ON p.geometry IS NOT NULL AND ST_Intersects(p.geometry,r.geometry)
           WHERE p.id=:pid GROUP BY p.id"""),{"pid":property_id}).mappings().first()
    if result is None: raise HTTPException(404,"Property not found")
    return {"property_id":property_id,"source":result["source"],"external_id":result["external_id"],
       "embargo_intersections_in_loaded_dataset":result["matches"],"legal_status":"NOT_VERIFIED",
       "warning":"Missing matches do not demonstrate that the property has no embargo. Check official current records."}


@lru_cache(maxsize=512)
def geocode_lookup(query: str):
    from urllib.parse import urlencode
    from urllib.request import Request, urlopen
    url = "https://nominatim.openstreetmap.org/search?" + urlencode({
      "q": query + ", Brasil", "format": "jsonv2", "limit": 5, "countrycodes": "br"
    })
    req = Request(url, headers={"User-Agent": "LiberatoFazendas/0.1 (contact: liberatogrupo on GitHub)"})
    with urlopen(req, timeout=15) as response:
        return json.load(response)


@router.get("/geocode")
def geocode(q: str = Query(min_length=3, max_length=120)):
    try:
        data = geocode_lookup(q)
        return {"provider": "OpenStreetMap Nominatim", "results": [
            {"name": r["display_name"], "latitude": float(r["lat"]),
             "longitude": float(r["lon"]), "type": r.get("type")}
            for r in data]}
    except Exception:
        raise HTTPException(503, "Geocoding service temporarily unavailable")
