import { useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { BookOpen, Check, ChevronDown, ChevronRight, Code2, Database, File, FileCode2, FileText, Folder, FolderOpen, Grid2X2, Import, List, MoreHorizontal, Pin, PinOff, Plus, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { CodeFile } from '../data';
import { CopyButton, EmptyState, Modal, Toggle } from './UI';

const folders = [
  { id: 'all', name: 'All memories', icon: Sparkles },
  { id: 'auth', name: 'auth-service', icon: ShieldCheck },
  { id: 'web', name: 'web-dashboard', icon: Code2 },
  { id: 'database', name: 'database', icon: Database },
  { id: 'infra', name: 'infrastructure', icon: Folder },
  { id: 'docs', name: 'documentation', icon: BookOpen },
];

export default function CodeIndexer({ files, setFiles, notify }: { files: CodeFile[]; setFiles: React.Dispatch<React.SetStateAction<CodeFile[]>>; notify: (title: string, message?: string) => void }) {
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState('all');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<CodeFile | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [treeOpen, setTreeOpen] = useState(true);
  const [newMemory, setNewMemory] = useState({ name: '', path: '', language: 'TypeScript', tag: '', description: '', content: '', pinned: true });
  const fileInput = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => files.filter(file => (folder === 'all' || file.folder === folder) && (!pinnedOnly || file.pinned) && (!query || `${file.name} ${file.path} ${file.tag} ${file.description} ${file.content}`.toLowerCase().includes(query.toLowerCase()))), [files, folder, pinnedOnly, query]);
  const togglePin = (id: string) => setFiles(prev => prev.map(file => file.id === id ? { ...file, pinned: !file.pinned } : file));

  const addMemory = (event: FormEvent) => {
    event.preventDefault();
    const file: CodeFile = { id: `memory-${Date.now()}`, name: newMemory.name, path: newMemory.path || `memories/${newMemory.name}`, folder: 'docs', language: newMemory.language, size: `${Math.max(.1, newMemory.content.length / 1024).toFixed(1)} KB`, updated: 'Just now', pinned: newMemory.pinned, tag: newMemory.tag || 'Personal note', description: newMemory.description || 'Saved local developer context.', content: newMemory.content };
    setFiles(prev => [file, ...prev]);
    setAddOpen(false);
    setNewMemory({ name: '', path: '', language: 'TypeScript', tag: '', description: '', content: '', pinned: true });
    notify('Memory saved', `${file.name} is now searchable in your local mesh.`);
  };

  const importFile = async (file?: File) => {
    if (!file) return;
    const content = await file.text();
    const extension = file.name.split('.').pop()?.toLowerCase();
    const language = extension === 'md' ? 'Markdown' : extension === 'yml' || extension === 'yaml' ? 'YAML' : extension === 'json' ? 'JSON' : extension === 'prisma' ? 'Prisma' : 'TypeScript';
    setNewMemory(prev => ({ ...prev, name: file.name, path: `imports/${file.name}`, content, language }));
    setAddOpen(true);
  };

  return <div className="animate-fade-in">
    <input ref={fileInput} type="file" className="hidden" onChange={e => importFile(e.target.files?.[0])} accept=".ts,.tsx,.js,.jsx,.md,.txt,.json,.yml,.yaml,.prisma,.env.example" />
    <div className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="glass-card overflow-hidden lg:sticky lg:top-5">
        <button onClick={() => setTreeOpen(!treeOpen)} className="flex w-full items-center gap-2 border-b border-slate-800/70 px-4 py-3.5 text-left"><FolderOpen size={15} className="text-violet" /><span className="code-font flex-1 truncate text-[11px] text-slate-300">acme-platform</span><ChevronDown size={13} className={`text-slate-600 transition ${treeOpen ? '' : '-rotate-90'}`} /></button>
        {treeOpen && <div className="p-2.5">
          <p className="eyebrow mb-2 px-2">Workspace memory</p>
          <div className="space-y-0.5">{folders.map(item => <button key={item.id} onClick={() => setFolder(item.id)} className={`group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[11px] transition ${folder === item.id ? 'bg-violet/10 text-violet-200' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}`}><item.icon size={13} className={folder === item.id ? 'text-violet' : 'text-slate-600'} /><span className="flex-1 truncate">{item.name}</span><span className={`code-font text-[9px] ${folder === item.id ? 'text-violet/70' : 'text-slate-700'}`}>{item.id === 'all' ? files.length : files.filter(f => f.folder === item.id).length}</span></button>)}</div>
          <div className="mx-2 my-3 h-px bg-slate-800/70" />
          <div className="rounded-lg border border-slate-800/70 bg-slate-950/40 p-3"><div className="flex items-center justify-between"><span className="text-[10px] text-slate-400">Index coverage</span><span className="code-font text-[10px] text-emerald">94%</span></div><div className="mt-2.5 h-1 overflow-hidden rounded-full bg-slate-800"><div className="h-full w-[94%] rounded-full bg-gradient-to-r from-violet to-emerald" /></div><p className="mt-2 text-[9px] leading-relaxed text-slate-600">1,206 of 1,284 files have semantic embeddings.</p></div>
          <button onClick={() => fileInput.current?.click()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 px-3 py-2.5 text-[10px] text-slate-500 transition hover:border-violet/40 hover:text-violet-300"><Import size={13} />Import a local file</button>
        </div>}
      </aside>

      <main className="min-w-0 space-y-4">
        <div className="glass-card p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1"><Search size={15} className="absolute left-3.5 top-3 text-slate-600" /><input className="input-dark py-2.5 pl-10 pr-4" placeholder="Search file names, snippets, notes, or symbols…" value={query} onChange={e => setQuery(e.target.value)} />{query && <button onClick={() => setQuery('')} className="absolute right-3 top-3 text-slate-600 hover:text-slate-300"><X size={14} /></button>}</div>
            <button onClick={() => setAddOpen(true)} className="btn-primary shrink-0"><Plus size={15} />New memory</button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-800/60 pt-3">
            <div className="flex items-center gap-2"><button onClick={() => setPinnedOnly(!pinnedOnly)} className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] transition ${pinnedOnly ? 'border-violet/30 bg-violet/10 text-violet-300' : 'border-slate-800 text-slate-500 hover:text-slate-300'}`}><Pin size={11} />Pinned only</button><span className="hidden text-[10px] text-slate-600 sm:inline">{filtered.length} {filtered.length === 1 ? 'memory' : 'memories'} found</span></div>
            <div className="flex rounded-md border border-slate-800 p-0.5"><button onClick={() => setView('grid')} className={`rounded p-1.5 ${view === 'grid' ? 'bg-slate-700/60 text-slate-200' : 'text-slate-600'}`} aria-label="Grid view"><Grid2X2 size={12} /></button><button onClick={() => setView('list')} className={`rounded p-1.5 ${view === 'list' ? 'bg-slate-700/60 text-slate-200' : 'text-slate-600'}`} aria-label="List view"><List size={13} /></button></div>
          </div>
        </div>

        {filtered.length === 0 ? <div className="glass-card"><EmptyState icon={<FileCode2 size={24} />} title="No memories found" description="Adjust your filters or save a new snippet to this workspace." /></div> : <div className={view === 'grid' ? 'grid gap-4 md:grid-cols-2' : 'space-y-3'}>
          {filtered.map(file => <article key={file.id} className="glass-card-hover group relative flex min-w-0 flex-col overflow-hidden">
            <div className="flex items-start gap-3 p-4 pb-3">
              <div className={`shrink-0 rounded-lg p-2 ${file.language === 'Markdown' ? 'bg-cyan/10 text-cyan' : file.language === 'YAML' || file.language === 'Prisma' ? 'bg-emerald/10 text-emerald' : 'bg-violet/10 text-violet'}`}>{file.language === 'Markdown' ? <FileText size={17} /> : <FileCode2 size={17} />}</div>
              <button onClick={() => setSelected(file)} className="min-w-0 flex-1 text-left"><div className="flex items-center gap-2"><h3 className="code-font truncate text-[11px] font-medium text-slate-200 transition group-hover:text-white">{file.name}</h3>{file.pinned && <Pin size={10} className="shrink-0 fill-violet/30 text-violet" />}</div><p className="mt-1 truncate text-[10px] text-slate-600">{file.description}</p></button>
              <button onClick={() => togglePin(file.id)} className={`rounded-md p-1.5 transition ${file.pinned ? 'text-violet hover:bg-violet/10' : 'text-slate-700 hover:bg-slate-800 hover:text-slate-300'}`} title={file.pinned ? 'Unpin memory' : 'Pin memory'}>{file.pinned ? <PinOff size={13} /> : <Pin size={13} />}</button>
            </div>
            <button onClick={() => setSelected(file)} className={`relative mx-4 block overflow-hidden rounded-lg border border-slate-800/70 bg-[#080c15] text-left ${view === 'list' ? 'max-h-24' : 'h-[142px]'}`}>
              <div className="flex h-full"><div className="code-font select-none border-r border-slate-800/50 px-2.5 py-3 text-right text-[9px] leading-[1.8] text-slate-700">{file.content.split('\n').slice(0, 7).map((_, i) => <div key={i}>{i + 1}</div>)}</div><pre className="code-font overflow-hidden whitespace-pre-wrap break-words p-3 text-[9px] leading-[1.8] text-slate-500">{file.content.split('\n').slice(0, 7).join('\n')}</pre></div><div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#080c15] to-transparent" />
            </button>
            <div className="flex items-center gap-2 p-3.5"><span className="chip border-slate-800 bg-slate-900/50 text-slate-500">{file.tag}</span><span className="code-font hidden text-[9px] text-slate-700 sm:inline">{file.language}</span><div className="ml-auto flex items-center gap-3"><span className="text-[9px] text-slate-600">{file.updated}</span><CopyButton text={file.content} /></div></div>
          </article>)}
        </div>}
      </main>
    </div>

    <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name || ''} description={selected?.description} width="max-w-3xl">
      {selected && <div>
        <div className="mb-4 flex flex-wrap items-center gap-2"><span className="chip border-violet/20 bg-violet/10 text-violet-300">{selected.language}</span><span className="chip border-slate-700 text-slate-400">{selected.tag}</span><span className="text-[10px] text-slate-600">{selected.size} · Updated {selected.updated}</span><div className="ml-auto flex gap-2"><CopyButton text={selected.content} label="Copy snippet" className="btn-secondary px-3 py-2" /><button onClick={() => { togglePin(selected.id); setSelected({ ...selected, pinned: !selected.pinned }); }} className="btn-secondary px-3 py-2">{selected.pinned ? <PinOff size={13} /> : <Pin size={13} />}{selected.pinned ? 'Unpin' : 'Pin'}</button></div></div>
        <div className="code-font mb-3 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-[10px] text-slate-500"><FileCode2 size={13} className="shrink-0 text-slate-600" /><span className="truncate">{selected.path}</span></div>
        <div className="max-h-[50vh] overflow-auto rounded-xl border border-slate-800 bg-[#070b14]"><div className="flex min-w-max"><div className="code-font select-none border-r border-slate-800/60 px-4 py-4 text-right text-[11px] leading-[1.8] text-slate-700">{selected.content.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}</div><pre className="code-font p-4 text-[11px] leading-[1.8] text-slate-300">{selected.content}</pre></div></div>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald/10 bg-emerald/[.04] p-3 text-[10px] text-slate-500"><Check size={13} className="shrink-0 text-emerald" />Indexed in local memory. Semantic links and code content remain on this device.</div>
      </div>}
    </Modal>

    <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Create a memory" description="Pin a snippet, architectural note, or decision to your searchable workspace." width="max-w-2xl">
      <form onSubmit={addMemory}>
        <div className="grid gap-4 sm:grid-cols-2"><div><label className="label-dark" htmlFor="memory-name">Name</label><input id="memory-name" required className="input-dark" placeholder="e.g. release-checklist.md" value={newMemory.name} onChange={e => setNewMemory({ ...newMemory, name: e.target.value })} /></div><div><label className="label-dark" htmlFor="memory-language">Language</label><select id="memory-language" className="input-dark" value={newMemory.language} onChange={e => setNewMemory({ ...newMemory, language: e.target.value })}><option>TypeScript</option><option>JavaScript</option><option>Markdown</option><option>YAML</option><option>JSON</option><option>Prisma</option><option>Plain text</option></select></div></div>
        <div className="mt-4"><label className="label-dark" htmlFor="memory-path">File path <span className="text-slate-700">(optional)</span></label><input id="memory-path" className="input-dark code-font text-[11px]" placeholder="docs/release-checklist.md" value={newMemory.path} onChange={e => setNewMemory({ ...newMemory, path: e.target.value })} /></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label className="label-dark" htmlFor="memory-tag">Category</label><input id="memory-tag" className="input-dark" placeholder="Architecture" value={newMemory.tag} onChange={e => setNewMemory({ ...newMemory, tag: e.target.value })} /></div><div><label className="label-dark" htmlFor="memory-description">Short description</label><input id="memory-description" className="input-dark" placeholder="Why this context matters" value={newMemory.description} onChange={e => setNewMemory({ ...newMemory, description: e.target.value })} /></div></div>
        <div className="mt-4"><div className="flex items-center justify-between"><label className="label-dark" htmlFor="memory-content">Content</label><button type="button" onClick={() => fileInput.current?.click()} className="mb-2 flex items-center gap-1 text-[10px] text-violet hover:text-violet-300"><Import size={11} />Import file</button></div><textarea id="memory-content" required rows={8} className="input-dark code-font resize-y text-[11px] leading-relaxed" placeholder="Paste code, notes, or an architectural decision…" value={newMemory.content} onChange={e => setNewMemory({ ...newMemory, content: e.target.value })} /></div>
        <div className="mt-4 flex items-center justify-between"><div><p className="text-xs text-slate-300">Pin to workspace</p><p className="mt-1 text-[10px] text-slate-600">Pinned memories are prioritized in AI context.</p></div><Toggle checked={newMemory.pinned} onChange={() => setNewMemory({ ...newMemory, pinned: !newMemory.pinned })} label="Pin to workspace" /></div>
        <div className="mt-6 flex justify-end gap-2 border-t border-slate-800 pt-4"><button type="button" onClick={() => setAddOpen(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary"><Plus size={14} />Save memory</button></div>
      </form>
    </Modal>
  </div>;
}
