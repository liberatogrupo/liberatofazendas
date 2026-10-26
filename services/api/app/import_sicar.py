"""Import an authorized SICAR public GeoJSON FeatureCollection into PostGIS.

Usage:
 DATABASE_URL=postgresql+psycopg://... python -m app.import_sicar /path/to/AREA_IMOVEL.geojson

Accepts GeoJSON in WGS84 (EPSG:4326). No scraping/CAPTCHA circumvention.
DO NOT import personally identifiable data. All properties are declaratory.
"""
import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from sqlalchemy import create_engine, text
from .main import settings

CODE_KEYS = ("cod_imovel","codimovel","cod_car","codigo_car","car","num_car")
NAME_KEYS = ("nom_imovel","nome_imovel","nome","nom_fazenda")
AREA_KEYS = ("num_area","area","area_ha")
STATE_KEYS = ("cod_estado","uf","estado")
CITY_KEYS = ("cod_municipio","cod_mun","municipio_ibge")
STATUS_KEYS = ("ind_status","situacao","status")
PRIVATE_KEYS = ("cpf","cnpj","email","telefone","endereco","proprietario","nome_proprietario")

def value(data, keys):
    for key in keys:
        if data.get(key) is not None:
            return str(data[key]).strip()
    return None

def convert_feature(feature):
    data = {str(k).lower():v for k,v in feature.get("properties",{}).items()}
    for key in PRIVATE_KEYS:
        data.pop(key,None)
    car=value(data,CODE_KEYS)
    if not car or len(car)>120:
        return None
    geometry=feature.get("geometry")
    if not geometry or geometry.get("type") not in ("Polygon","MultiPolygon"):
        return None
    area=value(data,AREA_KEYS)
    if area:
        area=area.replace(",",".")
        if not re.fullmatch(r"\d+(\.\d+)?",area):area=None
    return {
      "external_id":car,"car":car,"name":value(data,NAME_KEYS),
      "state":value(data,STATE_KEYS),"municipality":value(data,CITY_KEYS),
      "status":value(data,STATUS_KEYS),"area":area,
      "geometry":json.dumps(geometry),
    }

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("geojson",type=Path)
    parser.add_argument("--source-url",required=True,help="Official public download URL/provenance")
    args=parser.parse_args()
    features=json.loads(args.geojson.read_text(encoding="utf-8")).get("features",[])
    engine=create_engine(settings.database_url,pool_pre_ping=True)
    inserted=skipped=0
    sql=text("""INSERT INTO rural_properties
      (source,external_id,car_number,name,state_code,municipality_code,registration_status,area_hectares,geometry,source_url,source_updated_at)
      VALUES ('SICAR',:external_id,:car,:name,:state,:municipality,:status,:area,
        ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(:geometry),4326),4674)),3)),
        :source_url,:updated_at)
      ON CONFLICT (source,external_id) DO UPDATE SET car_number=EXCLUDED.car_number,
      name=EXCLUDED.name,state_code=EXCLUDED.state_code,municipality_code=EXCLUDED.municipality_code,
      registration_status=EXCLUDED.registration_status,area_hectares=EXCLUDED.area_hectares,
      geometry=EXCLUDED.geometry,source_url=EXCLUDED.source_url,source_updated_at=EXCLUDED.source_updated_at""")
    with engine.begin() as conn:
        for feature in features:
            item=convert_feature(feature)
            if not item:
                skipped+=1
                continue
            item["source_url"]=args.source_url
            item["updated_at"]=datetime.now(timezone.utc)
            conn.execute(sql,item)
            inserted+=1
    print(json.dumps({"imported":inserted,"skipped":skipped,"source":"SICAR"},ensure_ascii=False))

if __name__=="__main__":
    main()
