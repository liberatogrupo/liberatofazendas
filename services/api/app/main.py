from contextlib import asynccontextmanager
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://liberato:localdev@localhost:5432/liberato"
    cors_origins: str = "http://localhost:3000"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
engine = create_engine(settings.database_url, pool_pre_ping=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    engine.dispose()


app = FastAPI(title="LIBERATO FAZENDAS API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except SQLAlchemyError:
        return {"status": "degraded", "database": "unavailable"}


@app.get("/v1/sources")
def sources():
    return {
        "sources": [
            {"id": "ibge", "label": "IBGE", "status": "planned"},
            {"id": "incra", "label": "INCRA / SIGEF", "status": "planned"},
            {"id": "sicar", "label": "CAR / SICAR", "status": "planned"},
            {"id": "mapbiomas", "label": "MapBiomas", "status": "planned"},
        ]
    }


@app.get("/v1/properties")
def properties(
    limit: int = Query(default=25, ge=1, le=100),
    state: str | None = Query(default=None, min_length=2, max_length=2),
):
    conditions = ["geometry IS NOT NULL"]
    params: dict = {"limit": limit}
    if state:
        conditions.append("state_code = :state")
        params["state"] = state.upper()
    sql = text(f"""SELECT id, name, source, external_id, state_code,
               municipality_code, area_hectares,
               ST_AsGeoJSON(ST_Transform(geometry, 4326)) AS geojson
               FROM rural_properties WHERE {' AND '.join(conditions)}
               ORDER BY id DESC LIMIT :limit""")
    with engine.connect() as conn:
        records = conn.execute(sql, params).mappings().all()
    import json
    return {"type": "FeatureCollection", "features": [
        {"type": "Feature", "id": r["id"], "geometry": json.loads(r["geojson"]),
         "properties": {k: str(r[k]) if k == "area_hectares" and r[k] is not None else r[k]
                        for k in ("name", "source", "external_id", "state_code", "municipality_code", "area_hectares")}}
        for r in records
    ]}

# Operational territory endpoints
from .operational import router as operational_router
app.include_router(operational_router)

from .sicar import router as sicar_router
app.include_router(sicar_router)
