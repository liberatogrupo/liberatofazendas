"""Public rural property lookup. No personal identifiers are returned."""
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import create_engine, text
from .main import settings

router = APIRouter(prefix="/v1", tags=["sicar"])
engine = create_engine(settings.database_url, pool_pre_ping=True)

PUBLIC_COLUMNS = """id, external_id, source, name, car_number, registration_status,
property_type, state_code, municipality_code, area_hectares,
source_updated_at, source_url"""

def as_public(row):
    return {k: (str(v) if k in ("area_hectares", "source_updated_at") and v is not None else v)
            for k, v in row.items()}

@router.get("/properties/search")
def property_search(q: str = Query(min_length=4, max_length=120), limit: int = Query(25,ge=1,le=50)):
    term = "%" + q.strip().replace("%", r"\%").replace("_", r"\_") + "%"
    sql = text(f"""SELECT {PUBLIC_COLUMNS} FROM rural_properties
      WHERE car_number ILIKE :q OR external_id ILIKE :q OR name ILIKE :q
      ORDER BY CASE WHEN car_number=:exact THEN 0 ELSE 1 END, id DESC LIMIT :limit""")
    with engine.connect() as conn:
        rows = conn.execute(sql, {"q":term, "exact":q.strip(), "limit":limit}).mappings().all()
    return {"results":[as_public(row) for row in rows],
            "dataset_status":"search_in_imported_records_only",
            "notice":"CAR is a declaratory environmental registry, not proof of ownership or legal regularity."}

@router.get("/properties/{property_id}/profile")
def property_profile(property_id: int):
    with engine.connect() as conn:
        row = conn.execute(text(f"SELECT {PUBLIC_COLUMNS} FROM rural_properties WHERE id=:id"),
                           {"id":property_id}).mappings().first()
        if not row:
            raise HTTPException(404,"Property not found in imported records")
        env = conn.execute(text("""SELECT layer_type, ROUND(SUM(ST_Area(geometry::geography))::numeric/10000,3) AS hectares
              FROM rural_property_layers WHERE property_id=:id GROUP BY layer_type ORDER BY layer_type"""),
              {"id":property_id}).mappings().all()
        embargoes = conn.execute(text("""SELECT source,external_id,status,reference_date,source_url
              FROM environmental_restrictions e JOIN rural_properties p ON p.id=:id
              WHERE e.restriction_type='embargo' AND p.geometry IS NOT NULL
              AND ST_Intersects(e.geometry,p.geometry) ORDER BY reference_date DESC LIMIT 30"""),
              {"id":property_id}).mappings().all()
    return {"property":as_public(row),
      "environmental_layers":[{"layer":r["layer_type"],"hectares":float(r["hectares"])} for r in env],
      "embargo_matches":[{k:str(v) if v is not None else None for k,v in r.items()} for r in embargoes],
      "verification":"NOT_CERTIFIED","history_status":"not_imported",
      "disclaimer":"CAR is declaratory; intersections depend on completeness and dates of loaded layers. No match is not a legal clearance."}
