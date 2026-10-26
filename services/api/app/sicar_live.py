"""Read-only live SICAR GeoServer WFS connector. No CAPTCHA bypass or bulk scraping."""
import re
import json
import urllib.parse
import urllib.request
from functools import lru_cache
from fastapi import APIRouter, HTTPException, Query

router=APIRouter(prefix="/v1/sicar-live",tags=["SICAR official WFS"])
URL="https://geoserver.car.gov.br/geoserver/sicar/ows"
UFS=set("AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO".split())
CAR_RE=re.compile(r"^([A-Z]{2})-\d{7}-[0-9A-F]{32}$",re.I)
def request_wfs(uf,filter_expression,limit):
    if uf not in UFS:
        raise HTTPException(422,"Invalid state")
    params={"service":"WFS","version":"1.0.0","request":"GetFeature",
            "typeName":f"sicar:sicar_imoveis_{uf.lower()}",
            "outputFormat":"application/json","srsName":"EPSG:4326",
            "maxFeatures":str(min(limit,50)),"cql_filter":filter_expression}
    req=urllib.request.Request(URL+"?"+urllib.parse.urlencode(params),
        headers={"User-Agent":"LiberatoFazendas/0.1 (public WFS integration)","Accept":"application/json"})
    try:
        with urllib.request.urlopen(req,timeout=18) as res:
            if int(res.headers.get("Content-Length","0") or 0)>6500000:
                raise HTTPException(502,"WFS response too large")
            raw=res.read(6500001)
            if len(raw)>6500000:raise HTTPException(502,"WFS response too large")
            data=json.loads(raw)
            if data.get("type")!="FeatureCollection":raise ValueError("Unexpected WFS response")
            return data
    except HTTPException:raise
    except Exception as exc:
        raise HTTPException(503,"Official SICAR WFS unavailable; consult consulta.car.gov.br") from exc

def sanitize(data):
    features=[]
    for f in data.get("features",[]):
        p=f.get("properties",{})
        public={k:p.get(k) for k in ("cod_imovel","status_imovel","dat_criacao","data_atualizacao",
          "area","condicao","uf","municipio","cod_municipio_ibge","m_fiscal","tipo_imovel")}
        features.append({"type":"Feature","id":public["cod_imovel"],"geometry":f.get("geometry"),"properties":public})
    return {"type":"FeatureCollection","features":features,"source":"SICAR GeoServer WFS",
       "official_url":"https://consulta.car.gov.br/","legal_status":"NOT_CERTIFIED",
       "notice":"CAR is self-declared; not proof of ownership or environmental legality."}

@router.get("/car/{car}")
def by_car(car:str):
    match=CAR_RE.fullmatch(car.strip())
    if not match:raise HTTPException(422,"Invalid CAR code format")
    car=car.upper()
    return sanitize(request_wfs(match.group(1).upper(),"cod_imovel='"+car+"'",5))

@router.get("/area")
def by_bbox(uf:str=Query(min_length=2,max_length=2),bbox:str=Query(),limit:int=Query(20,ge=1,le=50)):
    uf=uf.upper()
    try: west,south,east,north=map(float,bbox.split(","))
    except Exception:raise HTTPException(422,"Invalid bbox")
    if not(-180<=west<east<=180 and -90<=south<north<=90) or east-west>0.1 or north-south>0.1:
        raise HTTPException(422,"Zoom in: bbox max 0.1 degrees")
    # WFS geometry in SIRGAS2000; envelope coordinates are lon,lat and filtered by the server.
    cql=f"BBOX(geo_area_imovel,{west},{south},{east},{north},'EPSG:4326')"
    return sanitize(request_wfs(uf,cql,limit))
