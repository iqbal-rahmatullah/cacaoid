import type { LucideIcon } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronLeft, ChevronRight, CircleAlert, CircleCheck, CircleX, FlaskConical, GitBranch, Hourglass, Info, LoaderCircle, PackageX, RotateCcw, SearchX,
} from 'lucide-react'
import { get, type Verdict } from '../lib/api'
import { pageList } from '../lib/results'

// One SNP in a fingerprint strip: genotype class, not read, or different from the sample above it.
export type Cell = 0 | 1 | 2 | 'miss' | 'diff'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

// text/soft = classes on light surfaces, hex = colour on the dark hero cards.
export const VERDICT: Record<Verdict, { text: string; soft: string; hex: string }> = {
  COCOK: { text: 'text-ok', soft: 'bg-ok-soft', hex: '#2BD37A' },
  'SESUAI SILANGAN': { text: 'text-mint-deep', soft: 'bg-mint-soft', hex: '#3DDC97' },
  KONTAMINAN: { text: 'text-kontam', soft: 'bg-kontam-soft', hex: '#FF7A2F' },
  'OFF-TYPE': { text: 'text-bad', soft: 'bg-bad-soft', hex: '#FF5A5F' },
  'BELUM ADA REFERENSI': { text: 'text-info', soft: 'bg-info-soft', hex: '#6E9BFF' },
  'UJI ULANG': { text: 'text-taupe', soft: 'bg-taupe-soft', hex: '#B9A99C' },
  'TIDAK DIKENAL': { text: 'text-bean', soft: 'bg-bean-soft', hex: '#A585FF' },
  'BATANG BAWAH': { text: 'text-warn', soft: 'bg-warn-soft', hex: '#FFC24B' },
  TAHAN: { text: 'text-kontam', soft: 'bg-kontam-soft', hex: '#FF7A2F' },
}

export const VERDICT_ICON: Record<Verdict, LucideIcon> = {
  COCOK: CircleCheck,
  'SESUAI SILANGAN': CircleCheck,
  KONTAMINAN: CircleX,
  'OFF-TYPE': CircleX,
  'BELUM ADA REFERENSI': Hourglass,
  'UJI ULANG': RotateCcw,
  'TIDAK DIKENAL': SearchX,
  'BATANG BAWAH': GitBranch,
  TAHAN: PackageX,
}

// One lab result in the field app (Beranda and Hasil lists).
export function ResultRow({ to, id, detail, v }: { to: string; id: string; detail: string; v: Verdict }) {
  const s = VERDICT[v]
  const Icon = VERDICT_ICON[v]
  return (
    <Link to={to} className="flex items-center gap-3 rounded-[18px] border border-line bg-white p-3.5 transition active:scale-[0.99]">
      <span className={cx('grid size-10 shrink-0 place-items-center rounded-[13px]', s.soft, s.text)}>
        <Icon size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <b className="block font-mono text-[12.5px]">{id}</b>
        <span className="block truncate text-[11.5px] text-body">{detail}</span>
      </span>
      <span className={cx('rounded-full px-2 py-0.5 text-[9.5px] font-extrabold whitespace-nowrap', s.soft, s.text)}>{v}</span>
    </Link>
  )
}

export const TONE = {
  ok: { icon: CircleCheck, text: 'text-ok', soft: 'bg-ok-soft' },
  warn: { icon: CircleAlert, text: 'text-warn', soft: 'bg-warn-soft' },
  bad: { icon: CircleAlert, text: 'text-bad', soft: 'bg-bad-soft' },
  info: { icon: Info, text: 'text-info', soft: 'bg-info-soft' },
} as const

export const GENOTYPE: Record<Cell, string> = { 0: '#3D2A1F', 1: '#FF8A3D', 2: '#D9C9B9', miss: '#ECE2D7', diff: '#E5484D' }

export function VerdictPill({ v, className }: { v: Verdict; className?: string }) {
  const s = VERDICT[v]
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold tracking-wide', s.soft, s.text, className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {v}
    </span>
  )
}

export function Card({ className, children, id }: { className?: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className={cx('rounded-[22px] border border-line bg-white p-6', className)}>
      {children}
    </section>
  )
}

type Glow = [color: string, at: string, size?: string]
// Dark chocolate surface with soft colour glows, e.g. glows={[['#3DDC97', '95% 5%']]}.
export function Dark({ glows = [], className, children, style }: { glows?: Glow[]; className?: string; children: ReactNode; style?: CSSProperties }) {
  const background = [...glows.map(([c, at, size = '70% 90%']) => `radial-gradient(${size} at ${at}, ${c}40, transparent 70%)`), '#1c110c'].join(', ')
  return (
    <section className={cx('relative overflow-hidden rounded-[26px] text-white', className)} style={{ background, ...style }}>
      {children}
    </section>
  )
}

export function CardHead({ title, sub, right, className }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex items-start justify-between gap-4', className)}>
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-mute">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export function IconTile({ icon: Icon, className, size = 'md' }: { icon: LucideIcon; className?: string; size?: 'sm' | 'md' }) {
  return (
    <span className={cx('grid shrink-0 place-items-center', size === 'md' ? 'size-10 rounded-[13px]' : 'size-8 rounded-[10px]', className)}>
      <Icon size={size === 'md' ? 19 : 16} />
    </span>
  )
}

export function Overline({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('text-[10.5px] font-extrabold tracking-[0.1em] text-mute uppercase', className)}>{children}</p>
}

// Real-data deployments set CACAOID_DATA=nyata on the API. Until it answers, assume demo data: never hide the warning by mistake.
export function useSimulated() {
  const health = useQuery({ queryKey: ['health'], queryFn: () => get<{ simulated_data: boolean }>('/health'), staleTime: Infinity })
  return health.data?.simulated_data ?? true
}

export function SimBadge({ className }: { className?: string }) {
  if (!useSimulated()) return null
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border border-warn/30 bg-warn-soft px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-warn', className)}>
      <FlaskConical size={12} /> SIMULASI
    </span>
  )
}

// value in [0, max]; the fill colour is a class (bg-*) so callers pick the tone.
export function Meter({ value, max = 1, fill, className, track = 'bg-cream' }: { value: number; max?: number; fill: string; className?: string; track?: string }) {
  return (
    <div className={cx('h-2.5 overflow-hidden rounded-full', track, className)}>
      <div className={cx('h-full rounded-full', fill)} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  )
}

export function Fingerprint({ cells, className, height = 'h-[26px]' }: { cells: Cell[]; className?: string; height?: string }) {
  return (
    <div className={cx('flex min-w-0 flex-1 gap-[2px]', className)}>
      {cells.map((c, i) => (
        <span key={i} className={cx('min-w-0 flex-1 rounded-[2px]', height)} style={{ background: GENOTYPE[c] }} />
      ))}
    </div>
  )
}

// Loading, failed and empty states for the web pages. A failure says what happened, not just "error".
export function Loading({ label = 'Memuat data…', className }: { label?: string; className?: string }) {
  return (
    <p role="status" className={cx('flex items-center gap-2 rounded-[22px] border border-line bg-white px-5 py-4 text-sm text-mute', className)}>
      <LoaderCircle size={16} className="animate-spin" /> {label}
    </p>
  )
}

export function Problem({ what, verb = 'dimuat', error, className }: { what: string; verb?: string; error: Error; className?: string }) {
  const offline = error instanceof TypeError
  return (
    <p role="alert" className={cx('rounded-[18px] bg-bad-soft px-4 py-3 text-[13px] text-bad', className)}>
      <b>
        {what} gagal {verb}.
      </b>{' '}
      {offline ? 'Server CacaoID tidak bisa dihubungi: periksa koneksi, atau jalankan API dengan pnpm dev.' : error.message}
    </p>
  )
}

export function Empty({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('rounded-[18px] border border-dashed border-line px-4 py-5 text-center text-[13px] text-body', className)}>{children}</p>
}

const pageBtn = 'grid size-[30px] place-items-center rounded-[9px] text-xs font-bold'

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  const arrow = (to: number, label: string, Icon: LucideIcon) => (
    <button
      type="button"
      aria-label={label}
      disabled={to < 1 || to > pages}
      onClick={() => onPage(to)}
      className={cx(pageBtn, 'border border-line bg-white text-body hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white')}
    >
      <Icon size={15} />
    </button>
  )
  return (
    <nav aria-label="Halaman" className="flex gap-1.5">
      {arrow(page - 1, 'Halaman sebelumnya', ChevronLeft)}
      {pageList(page, pages).map((p, i) =>
        p === '…' ? (
          <span key={`gap${i}`} className="grid size-[30px] place-items-center text-xs text-mute">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onPage(p)}
            className={cx(pageBtn, p === page ? 'bg-choc text-white' : 'bg-cream text-body hover:bg-line')}
          >
            {p}
          </button>
        ),
      )}
      {arrow(page + 1, 'Halaman berikutnya', ChevronRight)}
    </nav>
  )
}
