import "./style.css";
"use client";
import {useEffect,useRef,useState} from "react";
import maplibregl from "maplibre-gl";
type GeoFeature=GeoJSON.Feature<GeoJSON.Geometry,Record<string,unknown>>;
const API=process.env.NEXT_PUBLIC_API_URL||"http://localhost:8000";
export default function SicarLive(){
 const ref=useRef<HTMLDivElement>(null),map=useRef<maplibregl.Map|null>(null);
 const [code,setCode]=useState(""),[features,setFeatures]=useState<GeoFeature[]>([]);
 const [selected,setSelected]=useState<GeoFeature|null>(null);
 const [message,setMessage]=useState("Pesquise um número CAR completo para consultar o SICAR oficial.");
 useEffect(()=>{if(!ref.current)return;const m=new maplibregl.Map({container:ref.current,center:[-50,-12],zoom:4,style:"https://tiles.openfreemap.org/styles/bright"});map.current=m;
 m.addControl(new maplibregl.NavigationControl({visualizePitch:true}),"bottom-right");
 m.on("load",()=>{m.addSource("live-car",{type:"geojson",data:{type:"FeatureCollection",features:[]}});
 m.addLayer({id:"car-fill",type:"fill",source:"live-car",paint:{"fill-color":"#18a66c","fill-opacity":0.35}});
 m.addLayer({id:"car-line",type:"line",source:"live-car",paint:{"line-color":"#085a3a","line-width":3}});
 m.on("click","car-fill",e=>{const f=e.features?.[0];if(f)setSelected({type:"Feature",geometry:f.geometry as GeoJSON.Geometry,properties:f.properties||{}})});
 });return()=>{m.remove();map.current=null};},[]);
 async function lookup(e:React.FormEvent){e.preventDefault();setMessage("Consultando GeoServer oficial...");
 try{const r=await fetch(`${API}/v1/sicar-live/car/${encodeURIComponent(code.trim())}`);const data=await r.json();if(!r.ok)throw Error(data.detail||"Consulta indisponível");
 const list=(data.features||[]) as GeoFeature[];setFeatures(list);setSelected(list[0]||null);
 const m=map.current;if(m){(m.getSource("live-car") as maplibregl.GeoJSONSource|undefined)?.setData(data);
 if(list.length){const c=new maplibregl.LngLatBounds();function visit(x:unknown){if(Array.isArray(x)){if(typeof x[0]==="number"&&typeof x[1]==="number")c.extend([x[0],x[1]]);else x.forEach(visit)}}list.forEach(f=>visit((f.geometry as GeoJSON.Polygon|GeoJSON.MultiPolygon).coordinates));if(!c.isEmpty())m.fitBounds(c,{padding:90,maxZoom:14});}}
 setMessage(list.length?`${list.length} CAR encontrado(s) no SICAR oficial`:"Nenhum CAR retornado pela consulta oficial.");}
 catch(err){setMessage(err instanceof Error?err.message:"Falha na consulta SICAR");}}
 const p=selected?.properties;
 return <main className="sicar-app"><header><strong>LIBERATO <span>FAZENDAS</span></strong><a href="/operacional/">Explorar mapa</a></header><div className="sicar-map" ref={ref}/><form className="sicar-search" onSubmit={lookup}><label>CONSULTA PÚBLICA SICAR · AO VIVO</label><div><input value={code} onChange={e=>setCode(e.target.value)} placeholder="TO-1702109-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" aria-label="Código CAR completo"/><button type="submit">Consultar</button></div><small>{message}</small></form><aside className="sicar-profile"><small>FICHA DA PROPRIEDADE</small>{p?<><h2>{String(p.cod_imovel||"Imóvel rural")}</h2><dl><dt>Área declarada</dt><dd>{String(p.area??"Indisponível")} ha</dd><dt>Município / UF</dt><dd>{String(p.municipio??"—")} / {String(p.uf??"—")}</dd><dt>Situação SICAR</dt><dd>{String(p.status_imovel??"Não informada")}</dd><dt>Condição</dt><dd>{String(p.condicao??"Não informada")}</dd><dt>Data de criação</dt><dd>{String(p.dat_criacao??"Não informada")}</dd><dt>Atualização</dt><dd>{String(p.data_atualizacao??"Não informada")}</dd><dt>Tipo</dt><dd>{String(p.tipo_imovel??"—")}</dd></dl></>:<p>Informe o número CAR para consultar geometria e atributos publicados no serviço oficial.</p>}<div className="disclaimer">O CAR é declaratório. Não comprova propriedade, titularidade ou regularidade ambiental. Embargos e histórico exigem verificações independentes.</div><a href="https://consulta.car.gov.br/" target="_blank" rel="noreferrer">Abrir consulta oficial ↗</a></aside></main>;
}
