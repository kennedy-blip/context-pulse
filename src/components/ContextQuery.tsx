import { useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ArrowRight, BookOpen, Bot, Braces, Check, ChevronDown, ChevronRight, Clock3, Code2, Copy, Database, FileCode2, FileText, GitBranch, History, Lightbulb, Loader2, MessageSquareText, Network, Plus, Search, Send, Sparkles, Terminal, ThumbsDown, ThumbsUp, User, WandSparkles, X, Zap } from 'lucide-react';
import { initialEndpoints, initialErrors, initialFiles, querySuggestions } from '../data';
import type { TabId } from '../data';
import { CopyButton, Toggle } from './UI';
import { Avatar } from './UI';

interface Source { title: string; path: string; type: string; tab: TabId }
interface Answer { summary: string; details: string[]; code?: string; sources: Source[]; confidence: number }
interface Message { id: number; role: 'user' | 'assistant'; content: string; answer?: Answer; time: string }

const history = [
  { icon: ShieldIcon, text: 'JWT validation across services', group: 'Today' },
  { icon: Braces, text: 'Billing API consumer components', group: 'Today' },
  { icon: GitBranch, text: 'Changes on feature/mesh-insights', group: 'Yesterday' },
  { icon: Database, text: 'Database schema relationships', group: 'Yesterday' },
];

function answerQuery(query: string, scopes: string[]): Answer {
  const q = query.toLowerCase();
  if (q.includes('jwt') || q.includes('token') || q.includes('secret') || q.includes('authentication')) return {
    summary: 'JWT secrets are validated in auth-service, then trusted by api-gateway through a shared verification middleware. I found 3 direct validation points and 2 frontend consumers.',
    details: ['Primary validation happens in auth.middleware.ts using JWT_SECRET with the HS256 algorithm and contextpulse.local as the required issuer.', 'api-gateway calls the authenticate middleware before routing protected requests. The verified user ID and scopes are added to the request context.', 'apps/mobile currently misses the 401 token-refresh interceptor. This explains the recurring ERR_AUTH_TOKEN_EXPIRED signal in your debug vault.'],
    code: `const verify = createVerifier({\n  secret: process.env.JWT_SECRET!,\n  issuer: 'contextpulse.local',\n  algorithms: ['HS256'],\n});\n\nconst claims = await verify(token);\nreq.context.userId = claims.sub;`,
    sources: [{ title: 'auth.middleware.ts', path: 'services/auth/src/middleware/auth.middleware.ts', type: 'Primary implementation', tab: 'code' }, { title: 'POST /v1/auth/token', path: 'auth-service · Token issuance contract', type: 'API contract', tab: 'api' }, { title: 'ERR_AUTH_TOKEN_EXPIRED', path: '18 occurrences · Last seen 6 min ago', type: 'Related signal', tab: 'errors' }], confidence: 96,
  };
  if (q.includes('billing') || q.includes('subscription') || q.includes('consumer')) return {
    summary: 'The billing contract has 2 direct frontend consumers and one indirect consumer through the shared plan entitlement hook.',
    details: ['BillingSettings.tsx is the primary consumer. It fetches the active subscription and renders renewal, seat, and payment state.', 'PlanBadge.tsx reads plan entitlements from the same response and controls the visibility of Pro workspace features.', 'Both consumers use the generated types from packages/contracts, so the current response schema is aligned. No contract drift was detected.'],
    code: `const { data: subscription } = useQuery({\n  queryKey: ['billing', organizationId],\n  queryFn: () => api.get('/v1/billing/subscription'),\n});`,
    sources: [{ title: 'GET /v1/billing/subscription', path: 'billing-service · Stable v1 contract', type: 'API contract', tab: 'api' }, { title: 'BillingSettings.tsx', path: 'apps/web/src/settings/BillingSettings.tsx', type: 'Primary consumer', tab: 'code' }, { title: 'PlanBadge.tsx', path: 'apps/web/src/components/PlanBadge.tsx', type: 'Secondary consumer', tab: 'code' }], confidence: 94,
  };
  if (q.includes('redis') || q.includes('econnrefused') || q.includes('connection failure')) return {
    summary: 'The Redis failure is a local runtime connectivity issue, not an application logic bug. The gateway cannot reach Redis at 127.0.0.1:6379.',
    details: ['ERR_REDIS_CONNECTION has occurred 7 times, most recently 24 minutes ago. All traces share the same connection frame in cache.client.ts.', 'The redis-cache node is healthy in your last Docker index, which suggests the gateway was started outside the Docker network or Redis has since stopped.', 'Start the local Redis container and verify it with redis-cli ping. Inside Docker Compose, use redis:6379 rather than localhost.'],
    code: `docker compose -f infra/docker-compose.yml up -d redis\n\ndocker compose exec redis redis-cli ping\n# Expected: PONG`,
    sources: [{ title: 'ECONNREFUSED_REDIS', path: 'api-gateway · 7 occurrences', type: 'Grouped terminal error', tab: 'errors' }, { title: 'docker-compose.yml', path: 'infra/docker-compose.yml', type: 'Runtime configuration', tab: 'code' }, { title: 'redis-cache', path: 'Redis 7 · :6379', type: 'Mesh dependency', tab: 'mesh' }], confidence: 98,
  };
  if (q.includes('changed') || q.includes('recent') || q.includes('commit')) return {
    summary: 'The authentication flow changed in 3 commits on feature/mesh-insights. The main change moves scope hydration into auth.middleware.ts.',
    details: ['Commit 8f3a2c1 added issuer validation and reduced accepted algorithms to HS256 only.', 'Commit 4b21e9d moved req.context.scopes hydration from the gateway into the shared auth middleware.', 'Commit 19c77af updated useSession.ts to stop retrying after a 401 response. The mobile client has not received the equivalent fix yet.'],
    sources: [{ title: 'feature/mesh-insights', path: '3 commits ahead of main · No conflicts', type: 'Git branch', tab: 'mesh' }, { title: 'auth.middleware.ts', path: 'Modified 18 min ago', type: 'Changed source', tab: 'code' }, { title: 'useSession.ts', path: 'Modified 7 min ago', type: 'Changed consumer', tab: 'code' }], confidence: 92,
  };
  const lower = query.toLowerCase();
  const matchingFiles = initialFiles.filter(file => `${file.name} ${file.description} ${file.content}`.toLowerCase().includes(lower.split(' ')[0] || '___'));
  const genericSource: Source[] = matchingFiles.length ? matchingFiles.slice(0, 3).map(file => ({ title: file.name, path: file.path, type: 'Semantic code match', tab: 'code' as TabId })) : [{ title: 'architecture.md', path: 'docs/architecture.md', type: 'Closest semantic match', tab: 'code' }, { title: 'api-gateway', path: 'Core service · 8 direct dependencies', type: 'Related mesh node', tab: 'mesh' }, { title: 'Workspace memory index', path: '1,284 files · 86 connected nodes', type: 'Search scope', tab: 'mesh' }];
  return {
    summary: `I searched your local workspace for “${query}”. The strongest context connects architecture.md, api-gateway, and the shared service contracts.`,
    details: ['Your architecture notes define api-gateway as the entry point for all frontend traffic, with auth-service validating protected requests.', 'The current mesh contains 86 memory nodes across 6 packages. Source files, API contracts, environment references, and terminal signals are linked by local semantic embeddings.', matchingFiles.length ? `I found ${matchingFiles.length} high-relevance ${matchingFiles.length === 1 ? 'memory' : 'memories'} matching your leading search terms. Open the citations below to inspect their full content.` : 'This is a broader exploratory match. Adding a service, file, or symbol name will narrow the answer to more specific source context.'],
    sources: genericSource, confidence: matchingFiles.length ? 88 : 76,
  };
}

export default function ContextQuery({ onNavigate, notify }: { onNavigate: (tab: TabId) => void; notify: (title: string, message?: string) => void }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [scopes, setScopes] = useState(['code', 'api', 'errors', 'git']);
  const [saved, setSaved] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Record<number, 'up' | 'down'>>({});
  const endRef = useRef<HTMLDivElement>(null);

  const submit = (value = input) => {
    const query = value.trim();
    if (!query || loading) return;
    setInput(''); setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: query, time: 'Now' }]); setLoading(true);
    setTimeout(() => {
      const answer = answerQuery(query, scopes);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: query, answer, time: 'Now' }]); setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
    }, 950);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); submit(); } };
  const toggleScope = (scope: string) => setScopes(prev => prev.includes(scope) ? prev.filter(item => item !== scope) : [...prev, scope]);
  const clear = () => { setMessages([]); setInput(''); setFeedback({}); };

  return <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] animate-fade-in">
    <aside className="glass-card hidden overflow-hidden lg:block lg:sticky lg:top-5">
      <div className="border-b border-slate-800/70 p-3"><button onClick={clear} className="btn-secondary w-full border-violet/20 bg-violet/[.06] py-2 text-[11px] text-violet-200"><Plus size={13} />New conversation</button></div>
      <div className="p-3"><p className="eyebrow mb-2 px-1">Query history</p>{['Today', 'Yesterday'].map(group => <div key={group} className="mb-3"><p className="px-2 py-1 text-[9px] text-slate-700">{group}</p>{history.filter(item => item.group === group).map(item => <button key={item.text} onClick={() => submit(item.text)} className="group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[10px] leading-snug text-slate-500 transition hover:bg-slate-800/50 hover:text-slate-300"><item.icon size={12} className="shrink-0 text-slate-700 group-hover:text-violet" /><span className="line-clamp-2">{item.text}</span></button>)}</div>)}</div>
      <div className="mx-3 mb-3 rounded-lg border border-slate-800/70 bg-slate-950/40 p-3"><div className="flex items-center gap-2 text-[10px] text-slate-400"><Zap size={12} className="text-violet" />Local query credits</div><p className="mt-2 text-[9px] leading-relaxed text-slate-600">Unlimited. Semantic retrieval runs against demo data in your browser.</p></div>
    </aside>

    <main className="min-w-0 space-y-4">
      <div className="glass-card relative overflow-hidden p-4 sm:p-5">
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-violet/10 blur-[60px]" />
        <div className="relative flex items-center gap-3"><div className="rounded-xl border border-violet/20 bg-violet/10 p-2.5 text-violet shadow-violet"><WandSparkles size={19} /></div><div><h2 className="text-[14px] font-semibold text-slate-100">Ask your workspace anything</h2><p className="mt-1 text-[10px] text-slate-500">Semantic answers grounded in your local code, contracts, and errors.</p></div><span className="chip ml-auto hidden border-emerald/20 bg-emerald/[.06] text-emerald sm:inline-flex"><span className="status-dot bg-emerald" />Local context ready</span></div>
        <div className="relative mt-4 overflow-hidden rounded-xl border border-violet/25 bg-[#080d18] transition focus-within:border-violet/60 focus-within:ring-2 focus-within:ring-violet/10"><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKeyDown} rows={3} className="w-full resize-none bg-transparent p-4 pr-12 text-[13px] leading-relaxed text-slate-200 outline-none placeholder:text-slate-600" placeholder="Where is the JWT secret validated across my microservices?" /><button onClick={() => submit()} disabled={!input.trim() || loading} className="btn-primary absolute bottom-3 right-3 h-8 w-8 p-0" aria-label="Send query">{loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={15} />}</button><div className="absolute bottom-3 left-4 hidden items-center gap-1 text-[9px] text-slate-700 sm:flex"><span className="code-font rounded border border-slate-800 px-1.5 py-0.5">⌘ Enter</span><span>to ask</span></div></div>
        <div className="relative mt-3 flex flex-wrap items-center gap-1.5"><span className="mr-1 text-[9px] uppercase tracking-wider text-slate-700">Search in</span>{[{ id: 'code', label: 'Code & docs', icon: Code2 }, { id: 'api', label: 'API contracts', icon: Braces }, { id: 'errors', label: 'Error logs', icon: Terminal }, { id: 'git', label: 'Git history', icon: GitBranch }].map(scope => <button key={scope.id} onClick={() => toggleScope(scope.id)} className={`chip transition ${scopes.includes(scope.id) ? 'border-slate-700 bg-slate-800/70 text-slate-300' : 'border-slate-800/50 text-slate-700 line-through'}`}><scope.icon size={10} />{scope.label}{scopes.includes(scope.id) && <Check size={9} className="text-violet" />}</button>)}</div>
      </div>

      {messages.length === 0 && !loading ? <div className="space-y-4">
        <div className="glass-card px-5 py-10 text-center sm:py-12"><div className="relative mx-auto flex h-16 w-16 items-center justify-center"><div className="absolute inset-0 rounded-full border border-violet/20 bg-violet/[.04]" /><div className="absolute inset-2 animate-[spin_12s_linear_infinite] rounded-full border border-dashed border-violet/30" /><Sparkles size={23} className="relative text-violet" /></div><h3 className="mt-5 text-lg font-medium tracking-tight text-slate-200">Connect the dots in seconds.</h3><p className="mx-auto mt-2 max-w-md text-[11px] leading-relaxed text-slate-600">Ask cross-project questions without hunting through files, branches, or terminal history. Every answer links back to its source.</p><div className="mx-auto mt-7 grid max-w-2xl gap-2 text-left sm:grid-cols-2">{querySuggestions.map((suggestion, i) => <button key={suggestion} onClick={() => submit(suggestion)} className="group flex items-start gap-3 rounded-xl border border-slate-800/70 bg-slate-950/30 p-3.5 text-left transition hover:border-violet/25 hover:bg-violet/[.04]"><span className={`mt-0.5 rounded-md p-1.5 ${['bg-violet/10 text-violet', 'bg-cyan/10 text-cyan', 'bg-amber/10 text-amber', 'bg-emerald/10 text-emerald'][i]}`}>{[<Code2 size={13} />, <Braces size={13} />, <Terminal size={13} />, <GitBranch size={13} />][i]}</span><span className="flex-1 text-[10px] leading-relaxed text-slate-400 group-hover:text-slate-300">{suggestion}</span><ChevronRight size={12} className="mt-1 shrink-0 text-slate-700 group-hover:text-violet" /></button>)}</div></div>
        <div className="grid gap-3 sm:grid-cols-3">{[{ icon: Network, value: '86', label: 'connected memory nodes' }, { icon: FileCode2, value: '1,284', label: 'indexed source files' }, { icon: Clock3, value: '< 1s', label: 'local semantic retrieval' }].map(item => <div key={item.label} className="glass-card flex items-center gap-3 p-3.5"><item.icon size={15} className="text-violet/70" /><div><p className="text-sm font-medium text-slate-300">{item.value}</p><p className="mt-0.5 text-[9px] text-slate-600">{item.label}</p></div></div>)}</div>
      </div> : <div className="space-y-4 pb-4">
        {messages.map(message => message.role === 'user' ? <div key={message.id} className="flex justify-end gap-3"><div className="max-w-[85%] rounded-2xl rounded-tr-md border border-violet/20 bg-violet/10 px-4 py-3 text-[12px] leading-relaxed text-violet-50">{message.content}</div><Avatar /></div> : <article key={message.id} className="glass-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-800/70 px-4 py-3 sm:px-5"><div className="rounded-lg bg-violet/10 p-1.5 text-violet"><Sparkles size={14} /></div><div><p className="text-[11px] font-medium text-slate-300">ContextPulse</p><p className="mt-0.5 text-[8px] text-slate-600">Grounded in {message.answer?.sources.length || 0} local sources</p></div><span className="chip ml-auto border-emerald/15 bg-emerald/[.05] text-emerald"><Check size={9} />{message.answer?.confidence}% confidence</span></div>
          <div className="p-4 sm:p-5"><p className="text-[12px] leading-[1.85] text-slate-300">{message.answer?.summary}</p><div className="mt-4 space-y-3">{message.answer?.details.map((detail, i) => <div key={i} className="flex gap-3"><span className="code-font mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-[9px] text-violet">{i + 1}</span><p className="text-[11px] leading-[1.8] text-slate-400">{detail}</p></div>)}</div>{message.answer?.code && <div className="relative mt-4"><div className="absolute right-3 top-3 z-10"><CopyButton text={message.answer.code} /></div><pre className="code-block max-h-64 text-[10px]">{message.answer.code}</pre></div>}
            <div className="mt-5"><p className="eyebrow mb-2.5">Sources & citations</p><div className="space-y-2">{message.answer?.sources.map((source, i) => <button key={source.title} onClick={() => onNavigate(source.tab)} className="group flex w-full items-center gap-3 rounded-lg border border-slate-800/70 bg-slate-950/30 p-3 text-left transition hover:border-violet/25 hover:bg-violet/[.03]"><span className="code-font flex h-5 w-5 shrink-0 items-center justify-center rounded border border-violet/20 bg-violet/10 text-[9px] text-violet">{i + 1}</span><div className="min-w-0 flex-1"><p className="code-font truncate text-[10px] text-slate-300">{source.title}</p><p className="mt-1 truncate text-[9px] text-slate-600">{source.path}</p></div><span className="hidden text-[9px] text-slate-600 sm:inline">{source.type}</span><ArrowRight size={12} className="shrink-0 text-slate-700 group-hover:text-violet" /></button>)}</div></div>
          </div><div className="flex items-center gap-1 border-t border-slate-800/70 px-4 py-2.5"><CopyButton text={`${message.answer?.summary}\n\n${message.answer?.details.join('\n')}`} label="Copy answer" className="mr-2" /><button onClick={() => setSaved(prev => prev.includes(message.content) ? prev.filter(q => q !== message.content) : [...prev, message.content])} className={`flex items-center gap-1.5 rounded px-2 py-1 text-[10px] transition ${saved.includes(message.content) ? 'text-violet' : 'text-slate-600 hover:text-slate-300'}`}><BookOpen size={11} />{saved.includes(message.content) ? 'Saved' : 'Save'}</button><div className="ml-auto flex gap-1"><button onClick={() => { setFeedback({ ...feedback, [message.id]: 'up' }); notify('Thanks for the feedback', 'This answer was marked as helpful.'); }} className={`rounded p-1.5 ${feedback[message.id] === 'up' ? 'bg-emerald/10 text-emerald' : 'text-slate-700 hover:text-slate-300'}`} aria-label="Helpful"><ThumbsUp size={12} /></button><button onClick={() => setFeedback({ ...feedback, [message.id]: 'down' })} className={`rounded p-1.5 ${feedback[message.id] === 'down' ? 'bg-rose/10 text-rose' : 'text-slate-700 hover:text-slate-300'}`} aria-label="Not helpful"><ThumbsDown size={12} /></button></div></div>
        </article>)}
        {loading && <div className="glass-card flex items-center gap-4 p-5"><div className="rounded-lg bg-violet/10 p-2 text-violet"><Sparkles size={16} className="animate-pulse" /></div><div className="flex-1"><p className="text-[11px] text-slate-400">Traversing your local knowledge mesh…</p><div className="mt-2 h-1 w-48 max-w-full overflow-hidden rounded-full bg-slate-800"><div className="h-full w-1/2 animate-[loading_1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-violet to-cyan" /></div></div><span className="code-font hidden text-[9px] text-slate-600 sm:inline">86 nodes</span></div>}
        <div ref={endRef} />
      </div>}
    </main>
  </div>;
}

function ShieldIcon(props: { size?: number; className?: string }) { return <Code2 {...props} />; }
