"use client";
import {useEffect,useRef,useState} from "react";
import maplibregl from "maplibre-gl";
type Coord=[number,number];
const rad=(x:number)=>x*Math.PI/180;
function areaHa(points:Coord[]):number{
 if(points.length<3)return 0;
 // Spherical excess approximation for geodetic polygons, area in hectares.
 const earth=6378137;
 let s=0;
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length];
  s+=(rad(b[0])-rad(a[0]))*(2+Math.sin(rad(a[1]))+Math.sin(rad(b[1])));
 }
 return Math.abs(s*earth*earth/2)/10000;
}
const empty:GeoJSON.FeatureCollection={type:"FeatureCollection",features:[]};
export default function OperationalMap(){
 const node=useRef<HTMLDivElement>(null),map=useRef<maplibregl.Map|null>(null);
 const pointsRef=useRef<Coord[]>([]);
 const [points,setPoints]=useState<Coord[]>([]),[drawing,setDrawing]=useState(false),[query,setQuery]=useState("");
 const [pitch,setPitch]=useState(false),[sat,setSat]=useState(false),[message,setMessage]=useState("Toque em Medir área para desenhar um polígono real.");
 const [selected,setSelected]=useState<Record<string,unknown>|null>(null);
 const [layerState,setLayerState]=useState("Sem bases de propriedades/embargos importadas");
 useEffect(()=>{
  if(!node.current)return;
  const m=new maplibregl.Map({container:node.current,center:[-48.2,-10.6],zoom:6,style:"https://tiles.openfreemap.org/styles/bright"});
  map.current=m;
  m.addControl(new maplibregl.NavigationControl({visualizePitch:true}),"bottom-right");
  m.addControl(new maplibregl.ScaleControl({maxWidth:120,unit:"metric"}),"bottom-left");
  m.on("load",()=>{
   m.addSource("measured",{type:"geojson",data:empty});
   m.addLayer({id:"measured-fill",type:"fill",source:"measured",paint:{"fill-color":"#16a56d","fill-opacity":0.22}});
   m.addLayer({id:"measured-outline",type:"line",source:"measured",paint:{"line-color":"#07794d","line-width":3}});
   m.addSource("registered",{type:"geojson",data:empty});
   m.addLayer({id:"registered-fill",type:"fill",source:"registered",paint:{"fill-color":"#60b580","fill-opacity":.32}});
   m.addLayer({id:"registered-line",type:"line",source:"registered",paint:{"line-color":"#216e4d","line-width":2}});
   m.on("click","registered-fill",e=>setSelected(e.features?.[0]?.properties??null));
  });
  m.on("click",e=>{
   if(!drawingRef.current)return;
   const next=[...pointsRef.current,[e.lngLat.lng,e.lngLat.lat] as Coord];
   pointsRef.current=next;setPoints(next);
   renderPolygon(m,next);
  });
  return ()=>{m.remove();map.current=null;};
 },[]);
 const drawingRef=useRef(false);
 function renderPolygon(m:maplibregl.Map,coords:Coord[]){
  const polygon:GeoJSON.FeatureCollection=coords.length>=3?{type:"FeatureCollection",features:[{type:"Feature",properties:{},geometry:{type:"Polygon",coordinates:[[...coords,coords[0]]]}}]}:empty;
  (m.getSource("measured") as maplibregl.GeoJSONSource|undefined)?.setData(polygon);
 }
 function toggleMeasure(){drawingRef.current=!drawingRef.current;setDrawing(drawingRef.current);setMessage(drawingRef.current?"Clique nos vértices do terreno. Clique novamente em Medir para terminar.":"Medição finalizada. Resultado estimado a partir dos vértices selecionados.");}
 function clearMeasure(){pointsRef.current=[];setPoints([]);if(map.current)renderPolygon(map.current,[]);setMessage("Medição apagada.");}
 function locate(e:React.FormEvent){e.preventDefault();const match=query.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)$/);if(!match){setMessage("Pesquise por coordenadas no formato latitude, longitude. Busca por nome requer geocodificador.");return;}const lat=Number(match[1]),lon=Number(match[2]);if(lat>90||lat< -90||lon>180||lon< -180){setMessage("Coordenadas inválidas.");return;}map.current?.flyTo({center:[lon,lat],zoom:14});setMessage(`Coordenadas localizadas: ${lat}, ${lon}`);}
 function switchStyle(){const m=map.current;if(!m)return;const next=!sat;setSat(next);setSelected(null);m.setStyle(next?{version:8,sources:{imagery:{type:"raster",tiles:["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],tileSize:256,attribution:"Esri, Maxar, Earthstar Geographics, and the GIS User Community"}},layers:[{id:"imagery",type:"raster",source:"imagery"}]}:"https://tiles.openfreemap.org/styles/bright");setMessage("Mapa-base alterado. Medição visual será restaurada ao recarregar a tela.");}
 async function terrain(){const m=map.current;if(!m)return;try{if(pitch){m.setTerrain(null);m.easeTo({pitch:0});setPitch(false);}else{if(!m.getSource("elevation"))m.addSource("elevation",{type:"raster-dem",url:"https://tiles.mapterhorn.com/tilejson.json",tileSize:256});m.setTerrain({source:"elevation",exaggeration:1});m.easeTo({pitch:65,zoom:Math.max(m.getZoom(),10)});setPitch(true);}}catch{setMessage("Relevo 3D indisponível nesta conexão.");}}
 return <main className="ops"><header><div><strong>◈ LIBERATO</strong><small>FAZENDAS · INTELIGÊNCIA TERRITORIAL</small></div><span>EXPLORADOR RURAL</span></header><section className="op-map"><div ref={node} className="op-canvas"/><form onSubmit={locate} className="op-search"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Latitude, longitude (ex.: -10.5, -48.2)" aria-label="Buscar coordenadas"/><button type="submit">Localizar</button></form><div className="op-actions"><button onClick={toggleMeasure}>{drawing?"Finalizar medição":"Medir área"}</button><button onClick={clearMeasure}>Limpar</button><button onClick={switchStyle}>{sat?"Mapa":"Satélite"}</button><button onClick={terrain}>{pitch?"2D":"Relevo 3D"}</button></div><aside className="op-card"><small>ANÁLISE GEOGRÁFICA</small><strong>{points.length>=3?areaHa(points).toLocaleString("pt-BR",{maximumFractionDigits:2})+" ha":"— ha"}</strong><span>{points.length} vértices registrados</span><p>{message}</p><hr/><span>Propriedades / embargos</span><p>{layerState}. Sem consulta a órgãos públicos, a situação jurídica é <b>não determinada</b>.</p><a href="https://aie-consultapublica.ibama.gov.br/" target="_blank" rel="noreferrer">Consulta oficial IBAMA ↗</a></aside>{selected&&<aside className="op-selected"><button onClick={()=>setSelected(null)}>Fechar</button><h3>{String(selected.name??selected.external_id??"Área")}</h3><p>Registro geoespacial — não comprova titularidade.</p></aside>}</section><footer>LIBERATO FAZENDAS · Medições geodésicas estimadas, não substituem levantamentos técnicos ou certidões oficiais.</footer></main>
}
