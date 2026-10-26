"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function MapPanel() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [status, setStatus] = useState("Carregando mapa…");

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
      center: [-51.8, -14.2], zoom: 3.6,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    mapRef.current = map;
    map.on("load", async () => {
      try {
        const response = await fetch(`${API}/v1/properties?limit=100`, { signal: controller.signal });
        if (!response.ok) throw new Error("API indisponível");
        const collection = await response.json();
        if (!map.getStyle()) return;
        map.addSource("properties", { type: "geojson", data: collection });
        map.addLayer({ id: "property-fill", type: "fill", source: "properties", paint: { "fill-color": "#b5d08d", "fill-opacity": 0.27 } });
        map.addLayer({ id: "property-outline", type: "line", source: "properties", paint: { "line-color": "#527844", "line-width": 1.8 } });
        setStatus(`${collection.features.length} geometrias cadastradas`);
      } catch (error) {
        if (!controller.signal.aborted) setStatus("Mapa disponível · dados aguardando conexão");
      }
    });
    const controller = new AbortController();
    return () => { controller.abort(); map.remove(); mapRef.current = null; };
  }, []);

  return <div className="map-shell"><div ref={container} className="map-canvas" aria-label="Mapa interativo do Brasil" />
    <div className="map-tag"><span className="status-dot" /> Visualização territorial <span className="map-tag-separator">/</span> {status}</div>
  </div>;
}
