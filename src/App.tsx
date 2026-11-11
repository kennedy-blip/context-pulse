import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertTriangle, Bell, Braces, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, CloudDownload, Code2, Command, Download, FileCode2, FolderGit2, GitBranch, GitCommitHorizontal, Github, Keyboard, Layers3, Loader2, Menu, Network, Plus, RefreshCw, Search, Settings2, ShieldCheck, Sparkles, Terminal, Upload, X, Zap } from 'lucide-react';
import MeshGraph from './components/MeshGraph';
import CodeIndexer from './components/CodeIndexer';
import ApiHub from './components/ApiHub';
import ErrorVault from './components/ErrorVault';
import ContextQuery from './components/ContextQuery';
import { Avatar, Modal, Toggle } from './components/UI';
import { Toast } from './components/Toast';
import type { ToastData } from './components/Toast';
import { initialEndpoints, initialErrors, initialFiles, meshNodes } from './data';
import type { TabId } from './data';
import { usePersistentState } from './hooks';

const tabs: { id: TabId; label: string; shortLabel: string; icon: typeof Network }[] = [
  { id: 'mesh', label: 'Knowledge Mesh Graph', shortLabel: 'Knowledge Mesh', icon: Network },
  { id: 'code', label: 'Codebase Indexer', shortLabel: 'Codebase', icon: FileCode2 },
  { id: 'api', label: 'API Contract Hub', shortLabel: 'API Contracts', icon: Braces },
  { id: 'errors', label: 'Terminal Error Vault', shortLabel: 'Error Vault', icon: Terminal },
  { id: 'query', label: 'AI Context Query', shortLabel: 'AI Query', icon: Sparkles },
];
const pageInfo: Record<TabId, { eyebrow: string; title: string; description: string }> = {
  mesh: { eyebrow: 'LOCAL WORKSPACE / ACME-PLATFORM', title: 'Workspace overview', description: 'Your code, infrastructure, and institutional knowledge—connected.' },
  code: { eyebrow: 'MEMORY / CODEBASE INDEXER', title: 'Codebase & documentation', description: 'A searchable memory of the files, snippets, and decisions that matter.' },
  api: { eyebrow: 'REGISTRY / API CONTRACTS', title: 'API contract hub', description: 'Keep routes, payloads, schemas, and frontend consumers in sync.' },
  errors: { eyebrow: 'MEMORY / TERMINAL INTELLIGENCE', title: 'Terminal error vault', description: 'Turn recurring stack traces into reusable, contextual solutions.' },
  query: { eyebrow: 'INTELLIGENCE / SEMANTIC RETRIEVAL', title: 'AI context query', description: 'One question. Every relevant corner of your local workspace.' },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const hash = window.location.hash.replace('#', '') as TabId;
    return tabs.some(tab => tab.id === hash) ? hash : 'mesh';
  });
  const [files, setFiles] = usePersistentState('contextpulse.files', initialFiles);
  const [endpoints, setEndpoints] = usePersistentState('contextpulse.endpoints', initialEndpoints);
  const [errors, setErrors] = usePersistentState('contextpulse.errors', initialErrors);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('2 min ago');
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unread, setUnread] = useState(3);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [root, setRoot] = useState('~/dev/acme-platform');
  const [indexOptions, setIndexOptions] = useState({ docs: true, env: true, gitignore: true });
  const [settings, setSettings] = usePersistentState('contextpulse.settings', { autoIndex: true, redactSecrets: true, telemetry: false });
  const toastCounter = useRef(0);

  const notify = (title: string, message?: string, type: 'success' | 'info' = 'success') => {
    toastCounter.current += 1;
    setToast({ id: toastCounter.current, title, message, type });
  };
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen(open => !open); }
      if (event.key === 'Escape') { setNotificationsOpen(false); setProfileOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  useEffect(() => {
    const handler = () => { const hash = window.location.hash.replace('#', '') as TabId; if (tabs.some(tab => tab.id === hash)) setActiveTab(hash); };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = (tab: TabId) => {
    setActiveTab(tab); window.location.hash = tab; window.scrollTo({ top: 0, behavior: 'smooth' });
    setNotificationsOpen(false); setProfileOpen(false);
  };
  const indexWorkspace = () => {
    setIndexing(true);
    setTimeout(() => { setIndexing(false); setIndexOpen(false); setLastSync('Just now'); notify('Workspace indexed successfully', '1,284 files scanned · 24 new memories · 86 nodes connected.'); }, 1400);
  };
  const syncBranches = () => {
    if (syncing) return;
    setSyncing(true);
    setTimeout(() => { setSyncing(false); setLastSync('Just now'); notify('Git branches synchronized', 'main and feature/mesh-insights are up to date. No conflicts found.'); }, 1100);
  };
  const exportSnapshot = () => {
    const snapshot = { product: 'ContextPulse', version: '1.0.0', exportedAt: new Date().toISOString(), workspace: 'acme-platform', nodes: meshNodes.map(({ connections, ...node }) => ({ ...node, dependencies: connections })), memories: files, contracts: endpoints, debugSignals: errors, privacy: 'Environment values are redacted. Names and fingerprints only.' };
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `contextpulse-snapshot-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
    notify('Memory snapshot exported', `${files.length} memories, ${endpoints.length} contracts, and ${meshNodes.length} visual nodes saved locally.`);
  };
  const resetWorkspace = () => {
    localStorage.removeItem('contextpulse.files'); localStorage.removeItem('contextpulse.endpoints'); localStorage.removeItem('contextpulse.errors');
    setFiles(initialFiles); setEndpoints(initialEndpoints); setErrors(initialErrors); setProfileOpen(false); notify('Demo workspace restored', 'Your local memories, contracts, and signals were reset.');
  };

  const commandResults = useMemo(() => {
    const q = commandQuery.toLowerCase();
    const navigation = tabs.filter(tab => !q || `${tab.label} ${tab.id}`.toLowerCase().includes(q)).map(tab => ({ id: tab.id, title: tab.label, subtitle: 'Navigate workspace', type: 'Navigation', tab: tab.id, icon: tab.icon }));
    const nodes = meshNodes.filter(node => q && `${node.label} ${node.path}`.toLowerCase().includes(q)).slice(0, 4).map(node => ({ id: node.id, title: node.label, subtitle: node.path, type: 'Mesh node', tab: 'mesh' as TabId, icon: Network }));
    const memories = files.filter(file => q && `${file.name} ${file.path}`.toLowerCase().includes(q)).slice(0, 4).map(file => ({ id: file.id, title: file.name, subtitle: file.path, type: 'Memory', tab: 'code' as TabId, icon: FileCode2 }));
    const routes = endpoints.filter(endpoint => q && endpoint.path.toLowerCase().includes(q)).slice(0, 3).map(endpoint => ({ id: endpoint.id, title: `${endpoint.method} ${endpoint.path}`, subtitle: endpoint.service, type: 'API contract', tab: 'api' as TabId, icon: Braces }));
    return [...navigation, ...nodes, ...memories, ...routes].slice(0, 10);
  }, [commandQuery, files, endpoints]);

  return <div className="min-h-screen pb-7">
    <header className="relative z-40 border-b border-slate-800/70 bg-[#080c15]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[64px] max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate('mesh')} className="group flex shrink-0 items-center gap-2.5 text-left"><div className="relative rounded-[10px] border border-violet/30 bg-gradient-to-br from-violet/25 to-violet/5 p-2 text-violet shadow-[0_0_22px_rgba(139,92,246,.15)]"><Network size={20} strokeWidth={1.8} /><span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_6px_#06b6d4]" /></div><div><div className="flex items-center gap-2"><span className="text-[16px] font-semibold tracking-[-0.035em] text-white">Context<span className="text-violet-300">Pulse</span></span><span className="hidden rounded border border-slate-700 px-1 py-0.5 text-[7px] font-semibold uppercase tracking-widest text-slate-500 sm:inline">Local</span></div><p className="mt-0.5 hidden text-[8px] uppercase tracking-[.18em] text-slate-600 sm:block">Developer memory mesh</p></div></button>
        <div className="mx-auto hidden items-center gap-2 rounded-full border border-emerald/15 bg-emerald/[.04] px-3 py-1.5 md:flex"><span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-40" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" /></span><span className="text-[9px] font-medium text-emerald/90">Memory Engine: Synchronized</span><span className="text-[8px] text-emerald/40">(Local Mesh)</span></div>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <button onClick={() => setCommandOpen(true)} className="hidden h-8 items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-2.5 text-slate-600 transition hover:border-slate-700 hover:text-slate-300 sm:flex"><Search size={13} /><span className="text-[10px]">Quick find</span><span className="code-font ml-2 rounded border border-slate-800 px-1.5 py-0.5 text-[8px] text-slate-600">⌘ K</span></button>
          <button onClick={() => setCommandOpen(true)} className="icon-button h-8 w-8 sm:hidden" aria-label="Quick find"><Search size={15} /></button>
          <div className="relative"><button onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }} className="icon-button relative h-8 w-8" aria-label="Notifications"><Bell size={15} />{unread > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose ring-2 ring-[#080c15]" />}</button>{notificationsOpen && <div className="absolute right-0 top-11 w-[min(360px,calc(100vw-2rem))] animate-slide-in rounded-xl border border-slate-700/70 bg-[#0e1625] shadow-2xl"><div className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><h3 className="text-xs font-medium text-slate-200">Workspace activity</h3><button onClick={() => setUnread(0)} className="text-[9px] text-violet hover:text-violet-300">Mark all read</button></div><div className="p-2">{[{ title: 'Contract drift resolved', text: 'web-dashboard now matches auth v1.', time: '8 min ago', tab: 'api' as TabId, icon: Braces, color: 'text-cyan bg-cyan/10' }, { title: 'Recurring error detected', text: 'ERR_AUTH_TOKEN_EXPIRED occurred 18 times.', time: '24 min ago', tab: 'errors' as TabId, icon: AlertTriangle, color: 'text-amber bg-amber/10' }, { title: 'Branch sync complete', text: 'feature/mesh-insights is 3 commits ahead.', time: '1 hr ago', tab: 'mesh' as TabId, icon: GitBranch, color: 'text-violet bg-violet/10' }].map(item => <button key={item.title} onClick={() => { navigate(item.tab); setUnread(Math.max(0, unread - 1)); }} className="flex w-full items-start gap-3 rounded-lg p-3 text-left hover:bg-slate-800/40"><div className={`rounded-lg p-2 ${item.color}`}><item.icon size={13} /></div><div className="min-w-0 flex-1"><p className="text-[11px] text-slate-300">{item.title}</p><p className="mt-1 text-[9px] leading-relaxed text-slate-600">{item.text}</p><p className="mt-1 text-[8px] text-slate-700">{item.time}</p></div><ChevronRight size={12} className="mt-2 text-slate-700" /></button>)}</div></div>}</div>
          <div className="mx-1 h-5 w-px bg-slate-800" />
          <div className="relative"><button onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }} className="flex items-center gap-1.5 rounded-full"><Avatar /><ChevronDown size={11} className="hidden text-slate-600 sm:block" /></button>{profileOpen && <div className="absolute right-0 top-11 w-64 animate-slide-in rounded-xl border border-slate-700/70 bg-[#0e1625] p-2 shadow-2xl"><div className="border-b border-slate-800 px-2 pb-3 pt-1"><p className="text-xs font-medium text-slate-200">Alex Morgan</p><p className="mt-1 text-[9px] text-slate-600">dev@contextpulse.local</p><span className="chip mt-2 border-emerald/15 bg-emerald/[.05] text-emerald"><ShieldCheck size={9} />Local-only workspace</span></div><button onClick={() => { setSettingsOpen(true); setProfileOpen(false); }} className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[11px] text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"><Settings2 size={13} />Workspace settings</button><button onClick={resetWorkspace} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[11px] text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"><RefreshCw size={13} />Restore demo data</button></div>}</div>
        </div>
      </div>
      <div className="mx-auto flex h-[46px] max-w-[1600px] items-center gap-5 px-4 sm:px-6 lg:px-8">
        <nav className="no-scrollbar flex h-full flex-1 items-center gap-5 overflow-x-auto sm:gap-6" aria-label="Workspace navigation">{tabs.map(tab => <button key={tab.id} onClick={() => navigate(tab.id)} className={`nav-tab ${activeTab === tab.id ? 'nav-tab-active' : ''}`}><tab.icon size={13} className={activeTab === tab.id ? 'text-violet' : ''} /><span className="hidden md:inline">{tab.label}</span><span className="md:hidden">{tab.shortLabel}</span>{tab.id === 'errors' && errors.filter(error => error.status === 'unresolved').length > 0 && <span className="code-font rounded-full bg-amber/10 px-1.5 py-0.5 text-[8px] text-amber">{errors.filter(error => error.status === 'unresolved').length}</span>}</button>)}</nav>
        <button onClick={syncBranches} className="hidden shrink-0 items-center gap-2 rounded-md border border-slate-800 bg-slate-950/40 px-2.5 py-1.5 text-[9px] text-slate-500 transition hover:border-slate-700 hover:text-slate-300 lg:flex"><GitBranch size={11} className="text-violet/70" /><span className="code-font">feature/mesh-insights</span><span className="rounded bg-violet/10 px-1 text-[8px] text-violet">+3</span></button>
      </div>
    </header>

    <main className="mx-auto max-w-[1600px] px-4 pb-8 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-4 py-5 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="code-font text-[8px] font-medium tracking-[.16em] text-violet/70">{pageInfo[activeTab].eyebrow}</p><h1 className="mt-2 text-[23px] font-semibold tracking-[-0.035em] text-slate-100 sm:text-[26px]">{pageInfo[activeTab].title}</h1><p className="mt-1.5 text-[11px] text-slate-500 sm:text-xs">{pageInfo[activeTab].description}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setIndexOpen(true)} className="btn-primary"><Layers3 size={14} /><span>Index workspace</span></button>
          <button onClick={exportSnapshot} className="btn-secondary" title="Export memory snapshot"><Download size={14} /><span className="hidden sm:inline">Export snapshot</span></button>
          <button onClick={syncBranches} disabled={syncing} className="btn-secondary" title="Sync git branches">{syncing ? <Loader2 size={14} className="animate-spin" /> : <GitBranch size={14} />}<span className="hidden sm:inline">{syncing ? 'Syncing…' : 'Sync branches'}</span></button>
        </div>
      </section>

      {activeTab === 'mesh' && <MeshGraph onNavigate={navigate} notify={notify} />}
      {activeTab === 'code' && <CodeIndexer files={files} setFiles={setFiles} notify={notify} />}
      {activeTab === 'api' && <ApiHub endpoints={endpoints} setEndpoints={setEndpoints} onNavigate={navigate} notify={notify} />}
      {activeTab === 'errors' && <ErrorVault errors={errors} setErrors={setErrors} onNavigate={navigate} notify={notify} />}
      {activeTab === 'query' && <ContextQuery onNavigate={navigate} notify={notify} />}
    </main>

    <footer className="fixed inset-x-0 bottom-0 z-30 flex h-7 items-center border-t border-slate-800/70 bg-[#080c15]/95 px-4 text-[8px] text-slate-600 backdrop-blur sm:px-6"><span className="flex items-center gap-1.5 text-emerald/70"><span className="status-dot bg-emerald" />Local mesh online</span><span className="mx-3 h-3 w-px bg-slate-800" /><GitBranch size={9} className="mr-1" /><span className="code-font">feature/mesh-insights*</span><GitCommitHorizontal size={10} className="ml-3 mr-1" /><span className="code-font hidden sm:inline">8f3a2c1</span><div className="ml-auto flex items-center gap-3"><span className="hidden md:inline">Synced {lastSync}</span><span className="hidden items-center gap-1 sm:flex"><ShieldCheck size={9} />Secrets redacted</span><button onClick={() => setHelpOpen(true)} className="flex items-center gap-1 text-slate-500 hover:text-slate-200"><CircleHelp size={10} />Shortcuts</button></div></footer>

    <Toast toast={toast} onClose={() => setToast(null)} />

    <Modal open={indexOpen} onClose={() => !indexing && setIndexOpen(false)} title="Index local workspace" description="Build a semantic memory of your source, docs, configuration, and dependencies.">
      <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-violet/10 p-2 text-violet"><FolderGit2 size={18} /></div><div className="min-w-0 flex-1"><label className="label-dark mb-1">Workspace root</label><input className="code-font w-full bg-transparent text-[11px] text-slate-200 outline-none" value={root} onChange={e => setRoot(e.target.value)} /></div><span className="chip border-emerald/15 bg-emerald/[.05] text-emerald"><Check size={9} />Detected</span></div></div>
      <div className="mt-4 grid grid-cols-3 gap-2">{[{ value: '1,284', label: 'Files found' }, { value: '6', label: 'Packages' }, { value: '3', label: 'Git branches' }].map(item => <div key={item.label} className="rounded-lg border border-slate-800/70 p-3 text-center"><p className="text-base font-medium text-slate-200">{item.value}</p><p className="mt-1 text-[9px] text-slate-600">{item.label}</p></div>)}</div>
      <div className="mt-5 space-y-3">{[{ id: 'docs' as const, title: 'Include documentation & decisions', detail: 'Markdown, ADRs, comments, and README files' }, { id: 'env' as const, title: 'Index environment variable names', detail: 'Values are always redacted from memory snapshots' }, { id: 'gitignore' as const, title: 'Respect .gitignore', detail: 'Skip dependencies, build artifacts, and local caches' }].map(option => <div key={option.id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-800/50 px-3 py-2.5"><div><p className="text-[11px] text-slate-300">{option.title}</p><p className="mt-1 text-[9px] text-slate-600">{option.detail}</p></div><Toggle checked={indexOptions[option.id]} onChange={() => setIndexOptions({ ...indexOptions, [option.id]: !indexOptions[option.id] })} label={option.title} /></div>)}</div>
      <div className="mt-5 flex items-center gap-2 rounded-lg border border-cyan/10 bg-cyan/[.04] p-3 text-[10px] leading-relaxed text-slate-500"><ShieldCheck size={14} className="shrink-0 text-cyan" />This interactive workspace uses local demo data. A native connector is required to read your actual filesystem.</div>
      <div className="mt-5 flex justify-end gap-2 border-t border-slate-800 pt-4"><button disabled={indexing} onClick={() => setIndexOpen(false)} className="btn-secondary">Cancel</button><button disabled={indexing || !root.trim()} onClick={indexWorkspace} className="btn-primary min-w-[140px]">{indexing ? <><Loader2 size={14} className="animate-spin" />Indexing 1,284 files…</> : <><Zap size={14} />Start index scan</>}</button></div>
    </Modal>

    <Modal open={commandOpen} onClose={() => { setCommandOpen(false); setCommandQuery(''); }} title="Quick find" description="Jump to a workspace, memory, mesh node, or API contract." width="max-w-xl">
      <div className="relative"><Search size={16} className="absolute left-3.5 top-3.5 text-slate-600" /><input autoFocus value={commandQuery} onChange={e => setCommandQuery(e.target.value)} className="input-dark py-3 pl-10 pr-4" placeholder="Search ContextPulse…" /></div>
      <div className="mt-3 max-h-[420px] overflow-y-auto">{commandResults.length === 0 ? <div className="py-10 text-center text-xs text-slate-600">No results for “{commandQuery}”</div> : commandResults.map(result => <button key={`${result.type}-${result.id}`} onClick={() => { navigate(result.tab); setCommandOpen(false); setCommandQuery(''); if (result.type !== 'Navigation') notify(`${result.type} located`, `Opened ${result.title} in ${tabs.find(tab => tab.id === result.tab)?.label}.`); }} className="group flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-slate-800/50"><div className="rounded-lg border border-slate-800 bg-slate-950/50 p-2 text-slate-500 group-hover:text-violet"><result.icon size={14} /></div><div className="min-w-0 flex-1"><p className="truncate text-[11px] text-slate-300">{result.title}</p><p className="code-font mt-1 truncate text-[8px] text-slate-600">{result.subtitle}</p></div><span className="text-[9px] text-slate-700">{result.type}</span><ChevronRight size={12} className="text-slate-700" /></button>)}</div><div className="mt-3 flex items-center gap-3 border-t border-slate-800 pt-3 text-[9px] text-slate-700"><span className="code-font">↑↓ Navigate</span><span className="code-font">↵ Open</span><span className="code-font ml-auto">esc Close</span></div>
    </Modal>

    <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Workspace settings" description="Control how this browser stores and protects your local memory.">
      <div className="space-y-3">{[{ id: 'autoIndex' as const, title: 'Automatic re-indexing', text: 'Refresh semantic memory when workspace changes are detected.' }, { id: 'redactSecrets' as const, title: 'Redact environment secrets', text: 'Store variable names and fingerprints, never raw values.' }, { id: 'telemetry' as const, title: 'Anonymous usage telemetry', text: 'Disabled by default. No workspace content ever leaves this device.' }].map(item => <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-800/70 p-3.5"><div><p className="text-[11px] text-slate-300">{item.title}</p><p className="mt-1 text-[9px] leading-relaxed text-slate-600">{item.text}</p></div><Toggle checked={settings[item.id]} onChange={() => setSettings({ ...settings, [item.id]: !settings[item.id] })} label={item.title} /></div>)}</div><button onClick={() => { setSettingsOpen(false); notify('Settings saved', 'Your local workspace preferences are up to date.'); }} className="btn-primary mt-5 w-full">Save preferences</button>
    </Modal>

    <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Keyboard shortcuts" description="Move through your workspace without leaving the keyboard.">
      <div className="space-y-2">{[{ keys: '⌘ / Ctrl + K', action: 'Open quick find' }, { keys: '⌘ / Ctrl + Enter', action: 'Submit an AI context query' }, { keys: 'Esc', action: 'Close a dialog or popover' }, { keys: 'Drag', action: 'Move nodes or pan the knowledge graph' }, { keys: 'Scroll', action: 'Zoom in and out of the mesh' }].map(item => <div key={item.keys} className="flex items-center justify-between rounded-lg border border-slate-800/60 p-3"><span className="text-[11px] text-slate-400">{item.action}</span><span className="code-font rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[9px] text-slate-300">{item.keys}</span></div>)}</div>
    </Modal>
  </div>;
}
