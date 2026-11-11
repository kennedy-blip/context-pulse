import { CheckCircle2, Info, X } from 'lucide-react';

export interface ToastData { id: number; title: string; message?: string; type?: 'success' | 'info' }

export function Toast({ toast, onClose }: { toast: ToastData | null; onClose: () => void }) {
  if (!toast) return null;
  return <div className="fixed bottom-8 right-4 z-[100] w-[calc(100%-2rem)] max-w-sm animate-slide-in rounded-xl border border-slate-700/80 bg-[#111a2a]/95 p-4 shadow-2xl backdrop-blur-xl sm:bottom-10 sm:right-6" role="status">
    <div className="flex items-start gap-3">
      {toast.type === 'info' ? <Info size={18} className="mt-0.5 shrink-0 text-cyan" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald" />}
      <div className="min-w-0 flex-1"><p className="text-[13px] font-medium text-slate-100">{toast.title}</p>{toast.message && <p className="mt-1 text-xs leading-relaxed text-slate-500">{toast.message}</p>}</div>
      <button onClick={onClose} className="text-slate-600 hover:text-slate-300" aria-label="Dismiss notification"><X size={15} /></button>
    </div>
  </div>;
}
