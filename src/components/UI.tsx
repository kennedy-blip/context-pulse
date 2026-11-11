import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { copyText } from '../hooks';
import { useState } from 'react';

export function Modal({ open, onClose, title, description, children, width = 'max-w-lg' }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; width?: string }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    setTimeout(() => panel.current?.focus(), 10);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', handler);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-label="Close dialog" />
      <div ref={panel} tabIndex={-1} className={`relative max-h-[90vh] w-full ${width} overflow-auto rounded-2xl border border-slate-700/70 bg-[#0d1422] p-5 shadow-2xl outline-none animate-slide-in sm:p-6`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
            {description && <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{description}</p>}
          </div>
          <button className="icon-button -mr-1 -mt-1" onClick={onClose} aria-label="Close"><X size={17} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function CopyButton({ text, label, className = '' }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return <button onClick={copy} className={`inline-flex items-center gap-1.5 text-[11px] text-slate-500 transition hover:text-slate-200 ${className}`} aria-label={label || 'Copy to clipboard'}>{copied ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}{label && (copied ? 'Copied' : label)}</button>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? 'bg-violet' : 'bg-slate-700'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} /></button>;
}

export function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = { GET: 'border-cyan/20 bg-cyan/10 text-cyan', POST: 'border-emerald/20 bg-emerald/10 text-emerald', PUT: 'border-amber/20 bg-amber/10 text-amber', PATCH: 'border-violet/20 bg-violet/10 text-violet', DELETE: 'border-rose/20 bg-rose/10 text-rose', WS: 'border-violet/20 bg-violet/10 text-violet' };
  return <span className={`code-font inline-flex min-w-[48px] justify-center rounded border px-1.5 py-0.5 text-[9px] font-semibold ${colors[method] || colors.GET}`}>{method}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const style = status === 'healthy' || status === 'stable' || status === 'resolved' ? 'border-emerald/20 bg-emerald/10 text-emerald' : status === 'error' || status === 'critical' || status === 'deprecated' ? 'border-rose/20 bg-rose/10 text-rose' : 'border-amber/20 bg-amber/10 text-amber';
  return <span className={`chip capitalize ${style}`}><span className="status-dot bg-current" />{status}</span>;
}

export function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <div className="flex min-h-[250px] flex-col items-center justify-center px-6 text-center"><div className="mb-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-slate-500">{icon}</div><h3 className="text-sm font-medium text-slate-300">{title}</h3><p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-600">{description}</p></div>;
}

export function Avatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return <div className={`${size === 'sm' ? 'h-6 w-6 text-[9px]' : 'h-8 w-8 text-[10px]'} flex shrink-0 items-center justify-center rounded-full border border-violet/30 bg-gradient-to-br from-violet/40 to-cyan/20 font-semibold text-violet-100`}>AM</div>;
}
