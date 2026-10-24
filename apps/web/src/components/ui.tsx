import type { LucideIcon } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronRight, CircleAlert, CircleCheck, FlaskConical, Info, Search } from 'lucide-react'
import type { Cell, Verdict } from '../data/demo'

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

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx('rounded-[22px] border border-line bg-white p-6', className)}>{children}</section>
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

export function SimBadge({ className }: { className?: string }) {
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

type Action = { icon: LucideIcon; label: string; to?: string }
function ActionButton({ a, primary }: { a: Action; primary?: boolean }) {
  const cls = cx(
    'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13.5px] font-bold transition',
    primary ? 'bg-choc text-white hover:bg-choc-2' : 'border border-line bg-white hover:border-mute/50',
  )
  const body = (
    <>
      <a.icon size={16} className={primary ? 'text-mint' : ''} />
      {a.label}
    </>
  )
  return a.to ? <Link to={a.to} className={cls}>{body}</Link> : <button type="button" className={cls}>{body}</button>
}

export function TopBar({ crumb, title, sub, secondary, primary }: { crumb: [string, string]; title: string; sub: string; secondary?: Action; primary?: Action }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0 flex-1 basis-72">
        <nav className="flex items-center gap-1.5 text-[12.5px] font-semibold text-mute">
          {crumb[0]} <ChevronRight size={13} /> <span className="text-body">{crumb[1]}</span>
        </nav>
        <h1 className="mt-1 font-display text-[32px] leading-tight font-bold tracking-[-0.025em]">{title}</h1>
        <p className="mt-0.5 text-sm text-body">{sub}</p>
      </div>
      <div className="flex items-center gap-2.5">
        <label className="hidden w-[280px] items-center gap-2 rounded-full border border-line bg-white py-2 pr-2.5 pl-3.5 2xl:flex">
          <Search size={16} className="text-mute" />
          <input placeholder="Cari sampel, klon, kebun…" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-mute" />
          <kbd className="rounded-md bg-cream px-1.5 py-0.5 font-sans text-[11px] font-bold text-body">⌘K</kbd>
        </label>
        <button type="button" aria-label="Notifikasi" className="relative grid size-[42px] place-items-center rounded-full border border-line bg-white">
          <Bell size={18} />
          <span className="absolute top-2 right-2.5 size-2.5 rounded-full border-2 border-white bg-pod" />
        </button>
        {secondary && <ActionButton a={secondary} />}
        {primary && <ActionButton a={primary} primary />}
      </div>
    </header>
  )
}
