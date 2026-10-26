import { ArrowDownRight, ArrowUpRight, BarChart3, Compass, Database, Layers3, MapPinned, Menu, Search, ShieldCheck, Sprout, TrendingUp } from "lucide-react";
import { MapPanel } from "@/components/MapPanel";

const sources = [
  { name: "IBGE", detail: "Indicadores e território", mark: "IB" },
  { name: "INCRA / SIGEF", detail: "Georreferenciamento", mark: "IN" },
  { name: "CAR / SICAR", detail: "Cadastro ambiental", mark: "CA" },
  { name: "MapBiomas", detail: "Cobertura e uso do solo", mark: "MB" },
];

export default function Home() {
  return <div className="app-layout">
    <aside className="sidebar">
      <div className="brand"><span className="brand-symbol"><Sprout size={25} strokeWidth={1.7}/></span><span><strong>LIBERATO</strong><small>FAZENDAS</small></span></div>
      <div className="sidebar-heading">ESPAÇO DE TRABALHO</div>
      <nav className="nav">
        <a href="#visao-geral" className="nav-item active"><Compass size={19}/> Visão geral</a>
        <a href="/operacional/" className="nav-item"><MapPinned size={19}/> Mapa operacional</a>
        <a href="/sicar/" className="nav-item"><Database size={19}/> Consultar SICAR</a>
        <a href="/consultar/" className="nav-item"><BarChart3 size={19}/> Fichas rurais</a>
      </nav>
      <div className="sidebar-bottom"><div className="secure-icon"><ShieldCheck size={20}/></div><div><strong>Dados públicos</strong><span>Transparência e inteligência</span></div></div>
    </aside>
    <main className="main" id="visao-geral">
      <header className="topbar"><div className="breadcrumbs">Plataforma <span>/</span> <strong>Visão geral</strong></div><div className="header-end"><span className="environment"><span className="status-dot"/> AMBIENTE DE DESENVOLVIMENTO</span><button className="menu-button" aria-label="Menu"><Menu size={20}/></button><div className="avatar">LF</div></div></header>
      <div className="content">
        <div className="eyebrow"><span className="eyebrow-line"/> INTELIGÊNCIA TERRITORIAL BRASILEIRA</div>
        <div className="hero"><div><h1>O território em uma<br/><em>nova perspectiva.</em></h1><p>Uma visão mais inteligente do campo. Explore o território brasileiro, conecte informações e transforme dados públicos em conhecimento estratégico.</p></div><div className="hero-stamp"><Layers3 size={27}/><span>VISÃO<br/>INTEGRADA<br/>DO CAMPO</span></div></div>
        <section className="stat-grid" id="indicadores">
          <article className="stat"><div className="stat-title"><span>Território monitorado</span><MapPinned size={18}/></div><strong>Brasil</strong><div className="stat-foot">Cobertura geográfica nacional <ArrowUpRight size={15}/></div></article>
          <article className="stat"><div className="stat-title"><span>Bases mapeadas</span><Database size={18}/></div><strong>04 <small>fontes</small></strong><div className="stat-foot">Integrações planejadas <ArrowUpRight size={15}/></div></article>
          <article className="stat"><div className="stat-title"><span>Dados geoespaciais</span><TrendingUp size={18}/></div><strong>PostGIS</strong><div className="stat-foot">Infraestrutura preparada <ArrowUpRight size={15}/></div></article>
          <article className="stat"><div className="stat-title"><span>Fase da plataforma</span><ShieldCheck size={18}/></div><strong>Inicial</strong><div className="stat-foot">Estrutura em desenvolvimento <ArrowDownRight size={15}/></div></article>
        </section>
        <section className="territory" id="territorio"><div className="section-head"><div><span className="section-kicker">EXPLORADOR GEOGRÁFICO</span><h2>Inteligência sobre o mapa</h2><p>Navegue pelo Brasil e acompanhe a construção da nossa base territorial.</p></div><div className="map-action"><Search size={17}/> Brasil <span>·</span> Todos os estados</div></div><MapPanel/></section>
        <section className="sources" id="fontes"><div className="section-head"><div><span className="section-kicker">ECOSSISTEMA DE INFORMAÇÕES</span><h2>Fontes públicas de referência</h2><p>Estrutura pronta para futuras ingestões validadas e rastreáveis.</p></div></div><div className="source-grid">{sources.map(source => <article className="source-card" key={source.name}><span className="source-mark">{source.mark}</span><div><strong>{source.name}</strong><span>{source.detail}</span></div><span className="planned">Planejada</span></article>)}</div></section>
        <footer><span>© {new Date().getFullYear()} LIBERATO FAZENDAS</span><span>Inteligência que nasce do território.</span></footer>
      </div>
    </main>
  </div>;
}
