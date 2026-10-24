import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import { Bell, ChevronRight, Dna, LoaderCircle, Plus, Search, TestTubeDiagonal, Warehouse } from 'lucide-react'
import { get, sendForm, type BatchSummary, type SearchResult } from '../lib/api'
import { todayIso } from '../lib/field'
import { longDate, unseenBatches } from '../lib/results'
import type { useCurrentBatch } from '../lib/useCurrentBatch'
import { keep, remember } from '../lib/useSampleQueue'
import { Card, VerdictPill, cx } from './ui'

export type Action = { icon: LucideIcon; label: string; to?: string; onClick?: () => void; disabled?: boolean; busy?: boolean }

function ActionButton({ a, primary }: { a: Action; primary?: boolean }) {
  const cls = cx(
    'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13.5px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50',
    primary ? 'bg-choc text-white hover:bg-choc-2' : 'border border-line bg-white hover:border-mute/50',
  )
  const Icon = a.busy ? LoaderCircle : a.icon
  const body = (
    <>
      <Icon size={16} className={cx(primary && 'text-mint', a.busy && 'animate-spin')} />
      {a.label}
    </>
  )
  return a.to ? (
    <Link to={a.to} className={cls}>{body}</Link>
  ) : (
    <button type="button" onClick={a.onClick} disabled={a.disabled || a.busy} className={cls}>{body}</button>
  )
}

export function TopBar({ crumb, title, sub, secondary, primary }: { crumb: [string, ReactNode]; title: string; sub: ReactNode; secondary?: Action; primary?: Action }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 print:hidden">
      <div className="min-w-0 flex-1 basis-72">
        <nav className="flex items-center gap-1.5 text-[12.5px] font-semibold text-mute">
          {crumb[0]} <ChevronRight size={13} /> <span className="text-body">{crumb[1]}</span>
        </nav>
        <h1 className="mt-1 font-display text-[32px] leading-tight font-bold tracking-[-0.025em]">{title}</h1>
        <p className="mt-0.5 text-sm text-body">{sub}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchBox />
        <Notifications />
        {secondary && <ActionButton a={secondary} />}
        {primary && <ActionButton a={primary} primary />}
      </div>
    </header>
  )
}

// "sudah diverifikasi" only with at least one verdict: analysing a batch whose samples the lab file missed gives none.
const batchStatus = (b: BatchSummary) =>
  b.analyzed_at && Object.keys(b.counts).length ? 'sudah diverifikasi' : b.lab_file ? 'lab diunggah' : b.n_samples ? 'menunggu lab' : 'kosong'

// Which batch a page shows: a visible row under the header (a selector hidden in the breadcrumb went unnoticed).
// The choice is remembered per device and shared with the field app.
export function BatchBar({ current, canCreate = false, note, className }: { current: ReturnType<typeof useCurrentBatch>; canCreate?: boolean; note?: string; className?: string }) {
  return (
    <Card className={cx('mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4', className)}>
      <span className="text-[13px] font-extrabold">Batch</span>
      <BatchPicker current={current} canCreate={canCreate} />
      {note && <span className="text-[11.5px] text-mute xl:ml-auto">{note}</span>}
    </Card>
  )
}

// Batch dropdown; `canCreate` adds "+ Batch baru" (Unggah) so a lab shipment can be started from the web too.
export function BatchPicker({ current, canCreate = false }: { current: ReturnType<typeof useCurrentBatch>; canCreate?: boolean }) {
  const qc = useQueryClient()
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')
  const create = useMutation({
    mutationFn: () => {
      const f = new FormData()
      f.append('name', name.trim() || `Kiriman lab ${todayIso()}`)
      return sendForm<{ id: number }>('/batches', f)
    },
    onSuccess: async (r) => {
      await qc.invalidateQueries({ queryKey: ['batches'] }) // refetched first, so the new batch is in the list when chosen
      current.choose(r.id)
      setNaming(false)
      setName('')
    },
  })
  const list = current.batches.data ?? []
  return (
    <div className="flex flex-wrap items-center gap-2">
      {list.length > 0 && (
        <select
          aria-label="Batch"
          value={current.batchId ?? ''}
          onChange={(e) => current.choose(Number(e.target.value))}
          className="max-w-full cursor-pointer rounded-xl border border-line bg-white px-3 py-2 text-[13px] font-semibold outline-none focus:border-mint-deep"
        >
          {list.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} · {b.n_samples} sampel · {batchStatus(b)}
            </option>
          ))}
        </select>
      )}
      {!canCreate ? null : naming ? (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate()
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Kiriman lab ${todayIso()}`}
            className="w-56 rounded-xl border border-line bg-white px-3 py-2 text-[13px] font-semibold outline-none focus:border-mint-deep"
          />
          <button type="submit" disabled={create.isPending} className="rounded-full bg-choc px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-50">
            Buat
          </button>
          <button type="button" onClick={() => setNaming(false)} className="rounded-full border border-line px-3 py-2 text-[12.5px] font-bold">
            Batal
          </button>
        </form>
      ) : (
        <button type="button" onClick={() => setNaming(true)} className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-[12.5px] font-bold hover:bg-cream">
          <Plus size={14} /> Batch baru
        </button>
      )}
      {create.error && <span className="text-[12px] text-bad">{create.error.message}</span>}
    </div>
  )
}

type Hit = { key: string; to: string; icon: LucideIcon; title: string; detail: ReactNode; mono?: boolean }

function hits(r: SearchResult | undefined): Hit[] {
  if (!r) return []
  return [
    ...r.samples.map((s) => ({
      key: `s${s.batch_id}${s.sample_id}`, to: `/hasil/${s.batch_id}/${encodeURIComponent(s.sample_id)}`, icon: TestTubeDiagonal,
      title: s.sample_id, detail: s.verdict ? <VerdictPill v={s.verdict} /> : `${s.claim} · menunggu lab`, mono: true,
    })),
    ...r.clones.map((c) => ({ key: `c${c.name}`, to: `/registri?klon=${encodeURIComponent(c.name)}`, icon: Dna, title: c.name, detail: c.status })),
    ...r.providers.map((p) => ({ key: `p${p.id}`, to: `/penyedia#kebun-${p.id}`, icon: Warehouse, title: p.name, detail: [p.regency, p.province].filter(Boolean).join(', ') })),
  ]
}

// ⌘K / Ctrl+K: samples by ID, clones by name, gardens by name or regency (GET /search).
function SearchBox() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [at, setAt] = useState(0)
  const navigate = useNavigate()
  const input = useRef<HTMLInputElement>(null)
  const res = useQuery({
    queryKey: ['search', q.trim()],
    enabled: open && !!q.trim(),
    queryFn: () => get<SearchResult>(`/search?q=${encodeURIComponent(q.trim())}`),
    placeholderData: keepPreviousData,
  })
  const list = q.trim() ? hits(res.data) : []

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])

  const close = () => {
    setOpen(false)
    setQ('')
    setAt(0)
  }
  const go = (h: Hit | undefined) => {
    if (!h) return
    close()
    navigate(h.to)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-line bg-white py-2 pr-2.5 pl-3.5 text-[13px] text-mute transition hover:border-mute/50 2xl:w-[280px]"
      >
        <Search size={16} />
        <span className="hidden flex-1 text-left 2xl:inline">Cari sampel, klon, kebun…</span>
        <kbd className="rounded-md bg-cream px-1.5 py-0.5 font-sans text-[11px] font-bold text-body">⌘K</kbd>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-start bg-choc/40 px-4 pt-[12vh]" onMouseDown={close}>
          <div role="dialog" aria-label="Pencarian" className="mx-auto w-full max-w-xl overflow-hidden rounded-[22px] bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <label className="flex items-center gap-3 border-b border-line px-5 py-4">
              {res.isFetching ? <LoaderCircle size={18} className="animate-spin text-mute" /> : <Search size={18} className="text-mute" />}
              <input
                ref={input}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setAt(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') close()
                  if (e.key === 'Enter') go(list[at])
                  if (e.key === 'ArrowDown') setAt((i) => Math.min(i + 1, list.length - 1))
                  if (e.key === 'ArrowUp') setAt((i) => Math.max(i - 1, 0))
                }}
                placeholder="ID sampel (SIM-065), klon (Sulawesi 1), kebun (Kolaka)…"
                className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-mute"
              />
              <kbd className="rounded-md bg-cream px-1.5 py-0.5 text-[11px] font-bold text-body">Esc</kbd>
            </label>
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {res.isError && <li className="px-3 py-3 text-[13px] text-bad">Pencarian gagal: {res.error.message}</li>}
              {q.trim() && res.data && !list.length && <li className="px-3 py-3 text-[13px] text-mute">Tidak ada yang cocok dengan “{q.trim()}”.</li>}
              {!q.trim() && <li className="px-3 py-3 text-[13px] text-mute">Ketik untuk mencari. ↑↓ pilih, Enter buka.</li>}
              {list.map((h, i) => (
                <li key={h.key}>
                  <button
                    type="button"
                    onMouseEnter={() => setAt(i)}
                    onClick={() => go(h)}
                    className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left', i === at && 'bg-cream')}
                  >
                    <h.icon size={17} className="shrink-0 text-mute" />
                    <span className={cx('text-[13px] font-bold', h.mono && 'font-mono')}>{h.title}</span>
                    <span className="ml-auto truncate text-xs text-mute">{h.detail}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}

// New lab results, polled every minute (no push notifications). "BARU" = analysed after the bell was last opened.
function Notifications() {
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState<string | null>(() => remember('seen') || null)
  const batches = useQuery({ queryKey: ['batches'], queryFn: () => get<BatchSummary[]>('/batches'), refetchInterval: 60_000 })
  const analysed = (batches.data ?? []).filter((b) => b.analyzed_at)
  const fresh = new Set(unseenBatches(analysed, seen).map((b) => b.id))

  const toggle = () => {
    if (open) {
      const now = new Date().toISOString()
      setSeen(now)
      keep('seen', now)
    }
    setOpen(!open)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={fresh.size ? `Notifikasi: ${fresh.size} hasil lab baru` : 'Notifikasi'}
        aria-expanded={open}
        className="relative grid size-[42px] place-items-center rounded-full border border-line bg-white"
      >
        <Bell size={18} />
        {fresh.size > 0 && <span className="absolute top-2 right-2.5 size-2.5 rounded-full border-2 border-white bg-pod" />}
      </button>
      {open && <div aria-hidden className="fixed inset-0 z-30" onClick={toggle} />}
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-[18px] border border-line bg-white p-2 shadow-xl">
          <p className="px-3 pt-2 pb-1 text-[10.5px] font-extrabold tracking-[0.1em] text-mute uppercase">Hasil lab</p>
          {!analysed.length && <p className="px-3 py-3 text-[13px] text-mute">Belum ada hasil lab yang diverifikasi.</p>}
          {analysed.slice(0, 5).map((b) => {
            const bad = Object.entries(b.counts).filter(([v]) => !['COCOK', 'SESUAI SILANGAN'].includes(v)).reduce((n, [, c]) => n + (c ?? 0), 0)
            return (
              <Link key={b.id} to={`/hasil?batch=${b.id}`} onClick={toggle} className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-cream">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[13px] font-bold">
                    <span className="truncate">{b.name}</span>
                    {fresh.has(b.id) && <span className="rounded-full bg-pod px-1.5 py-px text-[9.5px] font-extrabold text-white">BARU</span>}
                  </span>
                  <span className="block text-xs text-mute">
                    {b.n_with_lab} hasil · {bad} perlu tindak lanjut · {longDate(b.analyzed_at)}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
