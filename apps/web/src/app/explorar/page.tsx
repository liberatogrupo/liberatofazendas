import Link from "next/link";
import { RuralExplorer } from "@/components/RuralExplorer";
import "./explorer.css";
export const metadata = { title: "Explorar território | LIBERATO FAZENDAS" };
export default function ExplorePage(){
 return <main className="explore-page"><header className="explore-header"><div><strong>◈ LIBERATO</strong><span>FAZENDAS · INTELIGÊNCIA TERRITORIAL</span></div><Link href="/">Visão geral</Link></header><section className="explore-body"><div className="explore-heading"><div><small>PLATAFORMA TERRITORIAL</small><h1>Explore o território.</h1><p>Mapas, georreferenciamento e análises em uma única experiência.</p></div><span>VERSÃO DE DESENVOLVIMENTO</span></div><RuralExplorer/><p className="explore-notice">Fontes oficiais ainda não importadas. Ausência de polígonos não equivale a ausência de embargos ou irregularidades. Consulte sempre os órgãos responsáveis.</p></section></main>
}