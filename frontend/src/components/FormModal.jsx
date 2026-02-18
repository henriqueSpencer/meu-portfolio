import { X } from 'lucide-react';

/**
 * Modal reutilizavel para formularios CRUD.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - title: string
 *  - children: conteudo do form
 *  - onSave: () => void
 *  - onDelete?: () => void  (se passado, exibe botao de excluir)
 *  - saveLabel?: string (default "Salvar")
 */
export default function FormModal({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  onDelete,
  saveLabel = 'Salvar',
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="glass-card relative z-10 mx-4 w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {children}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
          <div>
            {onDelete && (
              <button
                onClick={onDelete}
                className="rounded-lg px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
              >
                Excluir
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              {saveLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Campo de formulario reutilizavel.
 */
export function FormField({ label, hint, children, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-[10px] leading-tight text-slate-500">{hint}</p>
      )}
    </div>
  );
}

/**
 * Input estilizado para os forms.
 */
export function FormInput({ type = 'text', ...props }) {
  return (
    <input
      type={type}
      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
      {...props}
    />
  );
}

/**
 * Select estilizado para os forms.
 */
export function FormSelect({ children, ...props }) {
  return (
    <select
      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
      {...props}
    >
      {children}
    </select>
  );
}
