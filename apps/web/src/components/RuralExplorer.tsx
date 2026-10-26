"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const EMPTY: GeoJSON.FeatureCollection = {type:"FeatureCollection",features:[]};

export function RuralExplorer() {
 const div = useRef<HTMLDivElement>(null);
 const ref = useRef<maplibregl.Map|null>(null);
 const [terrain,setTerrain] = useState(false);
 const [embargos,setEmbargos] = useState(true);
 const [state,setState] = useState("Aguardando camadas oficiais...");
 const [selected,setSelected] = useState<Record<string,unknown>|null>(null);
 const [query,setQuery] = useState("");

 useEffect(()=>{
  if(!div.current || ref.current) return;
  const map=new maplibregl.Map({container:div.current,style:"https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",center:[-49,-11],zoom:5,pitch:0});
  ref.current=map;
  map.addControl(new maplibregl.NavigationControl({visualizePitch:true}),"bottom-right");
  map.on("load",()=>{
   map.addSource("plots",{type:"geojson",data:EMPTY});
   map.addSource("embargoes",{type:"geojson",data:EMPTY});
   map.addLayer({id:"plots-fill",type:"fill",source:"plots",paint:{"fill-color":"#4a9472","fill-opacity":0.28}});
   map.addLayer({id:"plots-outline",type:"line",source:"plots",paint:{"line-color":"#27684c","line-width":2}});
   map.addLayer({id:"embargo-fill",type:"fill",source:"embargoes",paint:{"fill-color":"#bd392f","fill-opacity":0.5}});
   map.addLayer({id:"embargo-outline",type:"line",source:"embargoes",paint:{"line-color":"#a72124","line-width":2}});
   ["plots-fill","embargo-fill"].forEach(id=>map.on("click",id,event=>{const f=event.features?.[0];if(f)setSelected(f.properties ?? {});}));
   void load();
  });
  async function load(){
   const b=map.getBounds();
   const bbox=[b.getWest(),b.getSouth(),b.getEast(),b.getNorth()].join(",");
   try{
    const response=await fetch(`${API}/v1/properties?limit=100&bbox=${encodeURIComponent(bbox)}`);
    if(!response.ok)throw Error();
    const data=await response.json();
    (map.getSource("plots") as maplibregl.GeoJSONSource).setData(data);
    setState(`${data.features.length} propriedades recebidas · embargos não conectados`);
   }catch{setState("Sem dados conectados · consulte fontes oficiais");}
  }
  map.on("moveend",()=>void load());
  return ()=>{map.remove();ref.current=null;};
 },[]);
 useEffect(()=>{const m=ref.current;if(!m?.getLayer("embargo-fill"))return;["embargo-fill","embargo-outline"].forEach(id=>m.setLayoutProperty(id,"visibility",embargos?"visible":"none"));},[embargos]);
 async function change3D(){
  const m=ref.current;if(!m)return;
  if(terrain){m.setTerrain(null);m.easeTo({pitch:0,duration:750});setTerrain(false);return;}
  try{
   if(!m.getSource("dem"))m.addSource("dem",{type:"raster-dem",url:"https://tiles.mapterhorn.com/tilejson.json"});
   m.setTerrain({source:"dem",exaggeration:1});m.easeTo({pitch:65,zoom:Math.max(9,m.getZoom()),duration:900});setTerrain(true);
  }catch{setState("Relevo 3D indisponível");}
 }
 function searchPlace(e:React.FormEvent){e.preventDefault();setState("Busca por municípios e fazendas depende da ingestão de dados oficiais.");}
 return <div className="rural-map-root">
  <div ref={div} className="rural-map-canvas" aria-label="Mapa territorial interativo"/>
  <form className="rural-search" onSubmit={searchPlace}><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar fazenda, município, coordenadas..." aria-label="Pesquisar"/><button>Buscar</button></form>
  <div className="rural-actions"><button type="button" onClick={()=>setEmbargos(v=>!v)}>{embargos?"☑":"☐"} Embargos</button><button type="button" onClick={change3D}>{terrain?"2D":"3D"} · Relevo</button></div>
  <div className="rural-legend"><strong>LIBERATO · TERRITÓRIO</strong><span>🟢 Propriedades cadastradas</span><span>🔴 Áreas embargadas (quando integradas)</span><small>{state}</small></div>
  {selected&&<div className="rural-sheet"><button onClick={()=>setSelected(null)} aria-label="Fechar">×</button><small>FICHA DA ÁREA</small><h3>{String(selected.name||selected.external_id||"Área selecionada")}</h3><p>Fonte: {String(selected.source||"não informada")}</p><p>Área: {String(selected.area_hectares||"não informada")} ha</p><p><strong>Situação ambiental não determinada.</strong> Uma camada sem registros não comprova ausência de embargo.</p><a href="https://aie-consultapublica.ibama.gov.br/" target="_blank" rel="noreferrer">Verificar situação no IBAMA ↗</a></div>}
 </div>;
}
