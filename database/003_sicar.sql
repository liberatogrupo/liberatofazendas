-- Public CAR/SICAR metadata and derived spatial overlays. Never infer ownership from CAR.
ALTER TABLE rural_properties ADD COLUMN IF NOT EXISTS car_number TEXT;
ALTER TABLE rural_properties ADD COLUMN IF NOT EXISTS registration_status TEXT;
ALTER TABLE rural_properties ADD COLUMN IF NOT EXISTS property_type TEXT;
ALTER TABLE rural_properties ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ;
ALTER TABLE rural_properties ADD COLUMN IF NOT EXISTS source_url TEXT;
CREATE INDEX IF NOT EXISTS rural_properties_car_idx ON rural_properties(car_number);
CREATE TABLE IF NOT EXISTS rural_property_layers (
 id BIGSERIAL PRIMARY KEY,
 property_id BIGINT NOT NULL REFERENCES rural_properties(id) ON DELETE CASCADE,
 layer_type TEXT NOT NULL CHECK(layer_type IN ('APP','RESERVA_LEGAL','VEGETACAO_NATIVA','AREA_CONSOLIDADA','AREA_POUSIO','HIDROGRAFIA','USO_RESTRITO')),
 source TEXT NOT NULL DEFAULT 'SICAR',
 geometry geometry(MultiPolygon,4674) NOT NULL,
 imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS rural_property_layers_geom_idx ON rural_property_layers USING GIST(geometry);
CREATE INDEX IF NOT EXISTS rural_property_layers_parent_idx ON rural_property_layers(property_id);
