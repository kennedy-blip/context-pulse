import { useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react';
import { Activity, AlertTriangle, ArrowUpRight, Box, Braces, Check, ChevronRight, CircleDot, Clock3, Code2, Database, FileCode2, FileText, GitBranch, Globe2, Layers3, Maximize2, Minus, Network, Plus, RefreshCw, Search, Server, Settings2, ShieldCheck, Sparkles, X, Zap } from 'lucide-react';
import { activities, meshEdges, meshNodes } from '../data';
import type { MeshNode, NodeType, TabId } from '../data';
import { EmptyState, StatusBadge } from './UI';

const typeConfig = {
  service: { color: '#8b5cf6', bg: 'bg-violet/10', text: 'text-violet', icon: Server },
  frontend: { color: '#06b6d4', bg: 'bg-cyan/10', text: 'text-cyan', icon: Globe2 },
  database: { color: '#10b981', bg: 'bg-emerald/10', text: 'text-emerald', icon: Database },
  config: { color: '#f59e0b', bg: 'bg-amber/10', text: 'text-amber', icon: Settings2 },
  docs: { color: '#94a3b8', bg: 'bg-slate-500/10', text: 'text-slate-400', icon: FileText },
};

const stats = [
  { label: 'Indexed files', value: '1,284', change: '+24 today', icon: FileCode2, color: 'text-violet', bg: 'bg-violet/10', bars: [30, 42, 35, 52, 47, 65, 58, 74] },
  { label: 'Memory nodes', value: '86', change: '12 connected', icon: Network, color: 'text-cyan', bg: 'bg-cyan/10', bars: [35, 35, 44, 40, 58, 53, 62, 70] },
  { label: 'API contracts', value: '24', change: '100% typed', icon: Braces, color: 'text-emerald', bg: 'bg-emerald/10', bars: [60, 48, 58, 66, 60, 73, 77, 77] },
  { label: 'Unresolved signals', value: '4', change: '2 need attention', icon: AlertTriangle, color: 'text-amber', bg: 'bg-amber/10', bars: [70, 60, 64, 42, 50, 36, 40, 28] },
];

export default function MeshGraph({ onNavigate, notify }: { onNavigate: (tab: TabId) => void; notify: (title: string, message?: string) => void }) {
  const [selectedId, setSelectedId] = useState('gateway');
  const [filter, setFilter] = useState<'all' | NodeType>('all');
  const [search, setSearch] = useState('');
  const [positions, setPositions] = useState(() => Object.fromEntries(meshNodes.map(n => [n.id, { x: n.x, y: n.y }])));
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [detailTab, setDetailTab] = useState<'overview' | 'dependencies' | 'activity'>('overview');
  const [showSearch, setShowSearch] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id?: string; startX: number; startY: number; panX: number; panY: number } | null>(null);
  const selected = meshNodes.find(n => n.id === selectedId)!;

  const visibleIds = useMemo(() => new Set(meshNodes.filter(n => (filter === 'all' || n.type === filter) && (!search || `${n.label} ${n.path}`.toLowerCase().includes(search.toLowerCase()))).map(n => n.id)), [filter, search]);
  const connected = selected.connections.map(id => meshNodes.find(n => n.id === id)).filter(Boolean) as MeshNode[];

  const pointFromEvent = (event: ReactPointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * 940 / rect.width, y: (event.clientY - rect.top) * 560 / rect.height };
  };
  const pointerDown = (event: ReactPointerEvent<SVGSVGElement>, id?: string) => {
    const point = pointFromEvent(event);
    drag.current = { id, startX: point.x, startY: point.y, panX: pan.x, panY: pan.y };
    if (id) {
      setSelectedId(id);
      setDetailTab('overview');
      event.stopPropagation();
    }
    svgRef.current?.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    const point = pointFromEvent(event);
    if (drag.current.id) {
      setPositions(prev => ({ ...prev, [drag.current!.id!]: { x: (point.x - pan.x) / zoom, y: (point.y - pan.y) / zoom } }));
    } else {
      setPan({ x: drag.current.panX + point.x - drag.current.startX, y: drag.current.panY + point.y - drag.current.startY });
    }
  };
  const pointerUp = () => { drag.current = null; };
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); setPositions(Object.fromEntries(meshNodes.map(n => [n.id, { x: n.x, y: n.y }]))); };
  const onWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    setZoom(z => Math.min(1.8, Math.max(.65, z + (event.deltaY < 0 ? .08 : -.08))));
  };

  return <div className="space-y-5 animate-fade-in">
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(stat => <div key={stat.label} className="glass-card-hover group relative overflow-hidden p-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-[11px] font-medium text-slate-500 sm:text-xs">{stat.label}</p><div className="mt-2 flex items-baseline gap-2.5"><span className="text-[25px] font-semibold tracking-[-0.04em] text-slate-100 sm:text-[28px]">{stat.value}</span><span className={`hidden text-[10px] sm:inline ${stat.label === 'Unresolved signals' ? 'text-amber/80' : 'text-emerald/80'}`}>{stat.change}</span></div></div>
          <div className={`rounded-lg p-2 ${stat.bg} ${stat.color}`}><stat.icon size={16} /></div>
        </div>
        <div className="absolute bottom-0 right-3 flex h-8 items-end gap-[3px] opacity-40 transition group-hover:opacity-70">{stat.bars.map((height, i) => <span key={i} className={`w-[3px] rounded-t-sm ${stat.bg.replace('/10', '/70')}`} style={{ height: `${height}%` }} />)}</div>
      </div>)}
    </section>

    <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
      <div className="glass-card min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-3"><div className="rounded-lg bg-violet/10 p-2 text-violet"><Network size={17} /></div><div><div className="flex items-center gap-2"><h2 className="section-title">Knowledge mesh</h2><span className="chip border-emerald/20 bg-emerald/[.07] text-emerald"><span className="status-dot animate-pulse-soft bg-emerald" />Live</span></div><p className="mt-0.5 text-[10px] text-slate-600">12 nodes visualized · 26 relationships</p></div></div>
          <div className="flex items-center gap-2">
            {showSearch && <div className="relative animate-fade-in"><Search size={13} className="absolute left-2.5 top-2.5 text-slate-600" /><input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a node…" className="input-dark w-40 py-2 pl-8 pr-7 text-[11px]" /><button onClick={() => { setSearch(''); setShowSearch(false); }} className="absolute right-2 top-2.5 text-slate-600 hover:text-slate-300"><X size={13} /></button></div>}
            {!showSearch && <button className="icon-button h-8 w-8" onClick={() => setShowSearch(true)} title="Search nodes"><Search size={14} /></button>}
            <button className="icon-button h-8 w-8" onClick={resetView} title="Reset graph view"><Maximize2 size={14} /></button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-800/60 px-4 py-2.5 no-scrollbar sm:px-5">
          {([['all', 'All nodes'], ['service', 'Services'], ['frontend', 'Frontend'], ['database', 'Data'], ['config', 'Config'], ['docs', 'Docs']] as const).map(([id, label]) => <button key={id} onClick={() => setFilter(id)} className={`shrink-0 rounded-md px-2.5 py-1.5 text-[10px] font-medium transition ${filter === id ? 'bg-slate-700/60 text-slate-100' : 'text-slate-600 hover:bg-slate-800/50 hover:text-slate-300'}`}>{label}</button>)}
          <span className="ml-auto hidden shrink-0 items-center gap-1 text-[9px] text-slate-600 md:flex"><CircleDot size={11} />Drag nodes to explore</span>
        </div>
        <div className="mesh-grid graph-viewport relative h-[420px] cursor-grab overflow-hidden active:cursor-grabbing sm:h-[480px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,.07),transparent_48%)]" />
          <svg ref={svgRef} viewBox="0 0 940 560" className="relative h-full w-full select-none" onPointerDown={e => pointerDown(e)} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={onWheel}>
            <defs>
              <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <filter id="lineGlow"><feGaussianBlur stdDeviation="1.5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <marker id="arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5" fill="none" stroke="#46516a" strokeWidth="1" /></marker>
            </defs>
            <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
              {meshEdges.map(([from, to, kind], index) => {
                const a = positions[from], b = positions[to];
                if (!a || !b) return null;
                const visible = visibleIds.has(from) && visibleIds.has(to);
                const active = selectedId === from || selectedId === to;
                const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2 - (index % 3 === 0 ? 13 : 0);
                return <path key={`${from}-${to}`} d={`M ${a.x} ${a.y} Q ${midX} ${midY} ${b.x} ${b.y}`} fill="none" stroke={kind === 'broken' ? '#f43f5e' : active ? '#7c5ac8' : kind === 'dashed' ? '#354057' : '#36445c'} strokeWidth={active ? 1.4 : .85} strokeDasharray={kind === 'dashed' ? '5 6' : kind === 'broken' ? '3 5' : undefined} opacity={visible ? active ? .85 : .52 : .05} markerEnd={kind ? undefined : 'url(#arrow)'} className="transition-opacity duration-300" />;
              })}
              {meshNodes.map(node => {
                const config = typeConfig[node.type];
                const Icon = config.icon;
                const pos = positions[node.id];
                const active = selectedId === node.id;
                const visible = visibleIds.has(node.id);
                const statusColor = node.status === 'healthy' ? '#10b981' : node.status === 'warning' ? '#f59e0b' : '#f43f5e';
                return <g key={node.id} transform={`translate(${pos.x} ${pos.y})`} opacity={visible ? 1 : .12} className="node-card transition-opacity duration-300" onPointerDown={e => pointerDown(e as unknown as ReactPointerEvent<SVGSVGElement>, node.id)}>
                  {active && <><circle r="36" fill={config.color} opacity=".08" filter="url(#nodeGlow)" /><circle r="29" fill="none" stroke={config.color} strokeWidth="1" strokeDasharray="3 4" opacity=".65" className="animate-[spin_18s_linear_infinite]" /></>}
                  <circle r={node.id === 'gateway' ? 25 : 22} fill="#101827" stroke={config.color} strokeWidth={active ? 1.8 : 1.1} opacity=".98" />
                  <circle r={node.id === 'gateway' ? 20 : 17} fill={config.color} opacity=".1" />
                  <Icon x={-8} y={-8} width={16} height={16} color={config.color} strokeWidth={1.8} pointerEvents="none" />
                  <circle cx="17" cy="-16" r="4.5" fill="#0b111d" /><circle cx="17" cy="-16" r="2.6" fill={statusColor} />
                  <text y="39" textAnchor="middle" fill={active ? '#edf1fa' : '#a3aec2'} fontSize="11" fontWeight={active ? 600 : 500} fontFamily="Inter, sans-serif" pointerEvents="none">{node.label}</text>
                  <text y="53" textAnchor="middle" fill="#58657c" fontSize="8.5" fontFamily="JetBrains Mono, monospace" pointerEvents="none">{node.subtitle}</text>
                </g>;
              })}
            </g>
          </svg>
          {visibleIds.size === 0 && <div className="absolute inset-0 flex items-center justify-center bg-[#090e19]/80"><EmptyState icon={<Search size={22} />} title="No matching nodes" description="Try another search term or select a different node type." /></div>}
          <div className="absolute bottom-4 left-4 hidden items-center gap-3 rounded-lg border border-slate-800/80 bg-[#0a101c]/90 px-3 py-2 backdrop-blur sm:flex">
            {[['#10b981', 'Healthy'], ['#f59e0b', 'Degraded'], ['#f43f5e', 'Broken']].map(([color, label]) => <span key={label} className="flex items-center gap-1.5 text-[9px] text-slate-500"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />{label}</span>)}
          </div>
          <div className="absolute bottom-4 right-4 flex items-center overflow-hidden rounded-lg border border-slate-800 bg-[#0a101c]/90 shadow-lg backdrop-blur">
            <button className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-white" onClick={() => setZoom(z => Math.max(.65, z - .1))} aria-label="Zoom out"><Minus size={13} /></button><span className="code-font w-10 text-center text-[9px] text-slate-500">{Math.round(zoom * 100)}%</span><button className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-white" onClick={() => setZoom(z => Math.min(1.8, z + .1))} aria-label="Zoom in"><Plus size={13} /></button>
          </div>
          <div className="absolute left-4 top-4 rounded-md border border-slate-800/60 bg-[#0a101c]/70 px-2 py-1 font-mono text-[8px] uppercase tracking-wider text-slate-600">Local mesh · 6 packages</div>
        </div>
        <div className="flex items-center justify-between border-t border-slate-800/70 px-4 py-2.5 text-[9px] text-slate-600 sm:px-5"><span className="flex items-center gap-1.5"><ShieldCheck size={11} className="text-emerald/70" />All data stays on this device</span><span className="code-font">Last indexed 04:18:22</span></div>
      </div>

      <aside className="space-y-4">
        <div className="glass-card overflow-hidden">
          <div className="border-b border-slate-800/80 p-4">
            <div className="flex items-start justify-between"><div className={`rounded-xl p-2.5 ${typeConfig[selected.type].bg} ${typeConfig[selected.type].text}`}>{(() => { const Icon = typeConfig[selected.type].icon; return <Icon size={20} />; })()}</div><StatusBadge status={selected.status} /></div>
            <h3 className="code-font mt-3 text-[14px] font-medium text-slate-100">{selected.label}</h3><p className="mt-1 text-[11px] leading-relaxed text-slate-500">{selected.description}</p>
          </div>
          <div className="flex border-b border-slate-800/70 px-3">
            {(['overview', 'dependencies', 'activity'] as const).map(tab => <button key={tab} onClick={() => setDetailTab(tab)} className={`flex-1 border-b-2 py-2.5 text-[10px] capitalize transition ${detailTab === tab ? 'border-violet text-slate-200' : 'border-transparent text-slate-600 hover:text-slate-300'}`}>{tab}</button>)}
          </div>
          <div className="min-h-[275px] p-4">
            {detailTab === 'overview' && <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-4">{selected.meta.map(item => <div key={item.label}><p className="text-[9px] uppercase tracking-wider text-slate-600">{item.label}</p><p className="code-font mt-1 text-[10px] text-slate-300">{item.value}</p></div>)}</div>
              <div className="my-4 h-px bg-slate-800/70" />
              <p className="eyebrow">Source location</p><div className="code-font mt-2 break-all rounded-md border border-slate-800 bg-slate-950/50 p-2.5 text-[9px] leading-relaxed text-slate-400">{selected.path}</div>
              <div className="mt-3 flex items-center justify-between text-[9px] text-slate-600"><span className="flex items-center gap-1.5"><Clock3 size={11} />Modified {selected.modified}</span><span className="code-font">{selected.version}</span></div>
              <button onClick={() => { onNavigate('code'); notify('Source workspace opened', `Showing indexed memories related to ${selected.label}.`); }} className="btn-secondary mt-4 w-full py-2 text-[11px]"><Code2 size={13} />Open source context<ArrowUpRight size={12} className="ml-auto" /></button>
            </>}
            {detailTab === 'dependencies' && <div className="space-y-2">{connected.map(node => { const Icon = typeConfig[node.type].icon; return <button key={node.id} onClick={() => { setSelectedId(node.id); setDetailTab('overview'); }} className="group flex w-full items-center gap-2.5 rounded-lg border border-slate-800/70 bg-slate-950/30 p-2.5 text-left transition hover:border-slate-700 hover:bg-slate-800/40"><div className={`rounded-md p-1.5 ${typeConfig[node.type].bg} ${typeConfig[node.type].text}`}><Icon size={13} /></div><div className="min-w-0 flex-1"><p className="code-font truncate text-[10px] text-slate-300">{node.label}</p><p className="mt-0.5 text-[9px] text-slate-600">{node.subtitle}</p></div><ChevronRight size={12} className="text-slate-700 group-hover:text-slate-400" /></button>; })}</div>}
            {detailTab === 'activity' && <div className="space-y-4">{activities.slice(0, 4).map((activity, i) => <div key={activity.id} className="relative flex gap-3">{i < 3 && <span className="absolute left-[5px] top-3 h-full w-px bg-slate-800" />}<span className="relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-[#0c1220] bg-violet/70 ring-1 ring-violet/30" /><div><p className="text-[10px] leading-snug text-slate-400">{activity.title}</p><p className="mt-1 text-[9px] text-slate-600">{activity.time}</p></div></div>)}</div>}
          </div>
          <div className="flex items-center justify-between border-t border-slate-800/70 px-4 py-3 text-[9px]"><span className="text-slate-600">{connected.length} direct dependencies</span><button onClick={() => setDetailTab('dependencies')} className="flex items-center gap-1 text-violet transition hover:text-violet-300">View graph<ChevronRight size={11} /></button></div>
        </div>
        <div className="glass-card p-4">
          <div className="mb-3.5 flex items-center justify-between"><h3 className="flex items-center gap-2 text-xs font-medium text-slate-300"><Activity size={13} className="text-violet" />Mesh activity</h3><button onClick={() => notify('Activity is up to date', 'No new mesh events since your last check.')} className="text-[9px] text-slate-600 hover:text-slate-300">View all</button></div>
          <div className="space-y-3">{activities.slice(0, 3).map(activity => <div key={activity.id} className="flex items-start gap-2.5"><span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${activity.type === 'error' ? 'bg-amber' : activity.type === 'api' ? 'bg-cyan' : activity.type === 'git' ? 'bg-violet' : 'bg-emerald'}`} /><div className="min-w-0 flex-1"><p className="truncate text-[10px] text-slate-400">{activity.title}</p><p className="mt-0.5 truncate text-[9px] text-slate-600">{activity.detail}</p></div><span className="shrink-0 text-[8px] text-slate-700">{activity.time}</span></div>)}</div>
        </div>
      </aside>
    </section>

    <section className="grid gap-5 lg:grid-cols-2">
      <div className="glass-card p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><div><h3 className="section-title">Recently pinned memories</h3><p className="mt-1 text-[10px] text-slate-600">Important context, ready when you need it</p></div><button onClick={() => onNavigate('code')} className="flex items-center gap-1 text-[10px] text-violet hover:text-violet-300">Open indexer<ChevronRight size={12} /></button></div><div className="grid gap-2 sm:grid-cols-3">{[{ icon: ShieldCheck, name: 'auth.middleware.ts', tag: 'JWT validation', color: 'text-violet' }, { icon: FileText, name: 'architecture.md', tag: 'System decisions', color: 'text-cyan' }, { icon: Layers3, name: 'docker-compose.yml', tag: 'Local runtime', color: 'text-emerald' }].map(file => <button key={file.name} onClick={() => onNavigate('code')} className="group rounded-lg border border-slate-800/70 bg-slate-950/30 p-3 text-left transition hover:border-slate-700"><file.icon size={15} className={file.color} /><p className="code-font mt-3 truncate text-[9px] text-slate-300">{file.name}</p><p className="mt-1 text-[9px] text-slate-600">{file.tag}</p></button>)}</div></div>
      <div className="glass-card p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><div><h3 className="section-title">Signals that need you</h3><p className="mt-1 text-[10px] text-slate-600">Grouped from your local terminal history</p></div><button onClick={() => onNavigate('errors')} className="flex items-center gap-1 text-[10px] text-amber hover:text-amber-300">Open vault<ChevronRight size={12} /></button></div><div className="space-y-2">{[{ title: 'JWT access token expired', count: '18 occurrences', source: 'auth-service' }, { title: 'Redis connection refused', count: '7 occurrences', source: 'api-gateway' }].map((error, i) => <button key={error.title} onClick={() => onNavigate('errors')} className="flex w-full items-center gap-3 rounded-lg border border-slate-800/70 bg-slate-950/30 p-3 text-left transition hover:border-amber/20"><div className={`rounded-md p-1.5 ${i ? 'bg-rose/10 text-rose' : 'bg-amber/10 text-amber'}`}><AlertTriangle size={13} /></div><div className="min-w-0 flex-1"><p className="truncate text-[11px] text-slate-300">{error.title}</p><p className="code-font mt-1 text-[9px] text-slate-600">{error.source} · {error.count}</p></div><ChevronRight size={13} className="text-slate-700" /></button>)}</div></div>
    </section>
  </div>;
}
