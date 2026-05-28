import { type ReactNode } from 'react'
import { CheckCircle2, Filter, Lock } from 'lucide-react'
import { type StepStatus } from './dashboard-config'

export function StepStatusPill({ status, labels }: { status: StepStatus; labels: Record<StepStatus, string> }) {
  if (status === 'locked') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
        <Lock className="size-3" />
        {labels.locked}
      </span>
    )
  }

  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-violet-300 bg-violet-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-700">
        {labels.active}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
      <CheckCircle2 className="size-3" />
      {labels.complete}
    </span>
  )
}

type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: (value: string) => void
  multiline?: boolean
}

export function Field({ label, value, onChange, onBlur, multiline = false }: FieldProps) {
  return (
    <label className="mt-2 block text-sm">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          onBlur={(event) => onBlur?.(event.target.value)}
          rows={4}
          className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/40"
        />
      ) : (
        <input
          value={value}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          onBlur={(event) => onBlur?.(event.target.value)}
          className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/40"
        />
      )}
    </label>
  )
}

export function MediaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">{label}</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{value}</p>
    </div>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="mt-2 block text-sm">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/40"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs">
      <span className="mb-1 flex items-center gap-1 font-semibold text-violet-700">
        <Filter className="size-3" />
        {label}
      </span>
      {children}
    </label>
  )
}

