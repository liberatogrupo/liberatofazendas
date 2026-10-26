CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE IF NOT EXISTS rural_properties (
  id BIGSERIAL PRIMARY KEY,
  external_id TEXT NOT NULL,
  source TEXT NOT NULL,
  name TEXT,
  municipality_code CHAR(7),
  state_code CHAR(2),
  area_hectares NUMERIC(16,4),
  geometry geometry(MultiPolygon, 4674),
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source, external_id)
);
CREATE INDEX IF NOT EXISTS rural_properties_geom_gix ON rural_properties USING GIST(geometry);
CREATE INDEX IF NOT EXISTS rural_properties_municipality_idx ON rural_properties(municipality_code);
CREATE INDEX IF NOT EXISTS rural_properties_source_idx ON rural_properties(source);
CREATE TABLE IF NOT EXISTS ingestion_runs (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  records_processed INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS environmental_restrictions (id BIGSERIAL PRIMARY KEY, source TEXT NOT NULL, external_id TEXT NOT NULL, restriction_type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'unknown', reference_date DATE, source_url TEXT, imported_at TIMESTAMPTZ NOT NULL DEFAULT now(), geometry geometry(MultiPolygon,4674) NOT NULL, UNIQUE(source, external_id));
CREATE INDEX IF NOT EXISTS environmental_restrictions_geom_gix ON environmental_restrictions USING GIST(geometry);
