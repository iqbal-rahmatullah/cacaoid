import { Link } from 'react-router-dom'
import {
  ArrowRight, BadgeCheck, Calendar, ChevronRight, ClipboardCheck, Download, FlaskConical, GitBranch, GitCompareArrows, Leaf,
  PackageX, RotateCcw, SearchX, ShieldCheck, TestTubeDiagonal, TriangleAlert,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { actions, batch, byKind, byProvince, pipeline, summary, verdictCounts } from '../data/demo'
import type { Verdict } from '../data/demo'
import { Card, CardHead, Dark, IconTile, Meter, Overline, TopBar, VERDICT, VerdictPill, cx } from '../components/ui'

const KPI: { label: string; value: string; note: string; icon: LucideIcon; tone: string; valueTone?: string }[] = [
  { label: 'Sampel diuji', value: '135', note: '4 kebun entres · 4 provinsi', icon: TestTubeDiagonal, tone: 'bg-mint-soft text-mint-deep' },
  { label: 'Bermasalah', value: '22', note: '6 off-type · 12 kontaminan · 2 batang bawah · 2 tak dikenal', icon: TriangleAlert, tone: 'bg-bad-soft text-bad', valueTone: 'text-bad' },
  { label: 'Lot ditahan', value: '1', note: 'LOT-H-07 · 16% bibit kontaminan', icon: PackageX, tone: 'bg-kontam-soft text-kontam', valueTone: 'text-kontam' },
  { label: 'Perlu uji ulang', value: '2', note: 'SIM-008 · SIM-034 · DNA terbaca < 85%', icon: RotateCcw, tone: 'bg-taupe-soft text-taupe', valueTone: 'text-taupe' },
]

const STEP_ICONS = [Leaf, FlaskConical, ShieldCheck, BadgeCheck, ClipboardCheck]

const ACTION_ICONS: Partial<Record<Verdict, LucideIcon>> = {
  'OFF-TYPE': GitCompareArrows,
  TAHAN: PackageX,
  'BATANG BAWAH': GitBranch,
  'TIDAK DIKENAL': SearchX,
  'UJI ULANG': RotateCcw,
}

const pct = (r: number) => `${(r * 100).toFixed(1).replace('.', ',')}%`
const rateFill = (r: number) => (r >= 0.15 ? 'bg-bad' : r >= 0.1 ? 'bg-pod' : 'bg-ok')

function RateBars({ title, rows }: { title: string; rows: { name: string; rate: number; frac: string }[] }) {
  return (
    <div className="space-y-3.5">
      <Overline>{title}</Overline>
      {rows.map((r) => (
        <div key={r.name}>
          <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
            <span className="font-semibold">{r.name}</span>
            <span className="flex items-baseline gap-2">
              <span className="text-xs text-mute">{r.frac}</span>
              <span className="font-extrabold">{pct(r.rate)}</span>
            </span>
          </div>
          <Meter value={r.rate} max={0.35} fill={rateFill(r.rate)} />
        </div>
      ))}
    </div>
  )
}

export default function Dasbor() {
  return (
    <>
      <TopBar
        crumb={['Verifikasi', 'Dasbor']}
        title="Dasbor verifikasi"
        sub={`${batch.name} · ${batch.samples} sampel · hasil lab masuk ${batch.analyzed}`}
        secondary={{ icon: Calendar, label: 'Okt 2026' }}
        primary={{ icon: Download, label: 'Unduh laporan', to: '/laporan' }}
      />

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <Dark glows={[['#3DDC97', '95% 5%', '80% 120%'], ['#FF8A3D', '5% 100%', '70% 90%']]} className="flex flex-col justify-between gap-7 p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold tracking-[0.08em] text-white/80">
              <span className="relative flex size-[7px]">
                <span className="absolute inset-0 animate-ping rounded-full bg-mint opacity-60" />
                <span className="size-[7px] rounded-full bg-mint" />
              </span>
              VERIFIKASI BIBIT · SULAWESI
            </span>
            <span className="text-[12.5px] text-white/50">1 batch · 4 kebun entres</span>
          </div>
          <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
            <p className="font-display text-[clamp(72px,8vw,108px)] leading-[0.9] font-bold tracking-[-0.04em] text-mint">{summary.okRate}</p>
            <div className="pb-2.5">
              <p className="text-xl leading-tight font-bold">
                sampel terverifikasi
                <br />
                sesuai klaim
              </p>
              <p className="mt-1.5 text-[13px] text-white/60">
                {summary.ok} dari {summary.withVerdict} sampel dengan vonis
              </p>
            </div>
          </div>
          <div>
            <div className="flex h-4 gap-[3px]">
              {verdictCounts.map(([v, n]) => (
                <div key={v} title={`${v}: ${n}`} className="min-w-1 rounded" style={{ flex: `${n} 1 0`, background: VERDICT[v].hex }} />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-4">
              {verdictCounts.map(([v, n]) => (
                <span key={v} className="flex items-center gap-1.5 text-[11px] font-semibold whitespace-nowrap text-white/65">
                  <span className="size-2 shrink-0 rounded-[3px]" style={{ background: VERDICT[v].hex }} />
                  {v} <b className="text-white">{n}</b>
                </span>
              ))}
            </div>
          </div>
        </Dark>

        <div className="grid grid-cols-2 gap-5">
          {KPI.map((k) => (
            <Card key={k.label} className="flex min-h-[158px] flex-col justify-between gap-3 p-5">
              <div className="flex items-center gap-2.5">
                <IconTile icon={k.icon} size="sm" className={k.tone} />
                <span className="text-[13.5px] font-bold text-body">{k.label}</span>
              </div>
              <div>
                <p className={cx('font-display text-[44px] leading-none font-bold tracking-tight', k.valueTone)}>{k.value}</p>
                <p className="mt-1.5 text-xs leading-snug text-mute">{k.note}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="mt-5">
        <CardHead title="Perjalanan sampel" sub="CacaoID mendampingi dari daun sampai keputusan; lab terakreditasi mana pun bisa dipakai" />
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {pipeline.map((s, i) => {
            const Icon = STEP_ICONS[i]
            const last = i === pipeline.length - 1
            return (
              <li key={s.label} className={cx('relative flex items-center gap-3 rounded-2xl p-3.5', last ? 'bg-pod-soft' : 'bg-cream')}>
                <IconTile icon={Icon} className={last ? 'bg-white text-kontam' : 'bg-white text-mint-deep'} />
                <div className="min-w-0">
                  <p className="font-display text-2xl leading-none font-bold">{s.value}</p>
                  <p className="mt-1 text-[12.5px] font-bold">{s.label}</p>
                  <p className="text-[11.5px] text-mute">{s.sub}</p>
                </div>
                {!last && <ChevronRight size={16} className="absolute top-1/2 -right-3 hidden -translate-y-1/2 text-mute xl:block" />}
              </li>
            )
          })}
        </ol>
      </Card>

      <div className="mt-5 grid gap-5 xl:grid-cols-[520px_minmax(0,1fr)]">
        <Card className="space-y-5">
          <CardHead title="Tingkat bermasalah" sub="% sampel bukan klon yang diklaim · skala 0–35%" />
          <RateBars title="Per provinsi" rows={byProvince} />
          <RateBars title="Per jenis sampel" rows={byKind} />
        </Card>

        <Card className="pb-3">
          <CardHead
            title="Perlu tindakan"
            sub="Diurutkan dari dampak terbesar"
            right={
              <Link to="/hasil" className="inline-flex items-center gap-1 text-[13px] font-bold text-mint-deep hover:underline">
                Lihat semua {summary.followUp} <ArrowRight size={15} />
              </Link>
            }
          />
          <ul className="mt-2">
            {actions.map((a) => {
              const Icon = ACTION_ICONS[a.v] ?? TriangleAlert
              const row = (
                <>
                  <IconTile icon={Icon} className={cx(VERDICT[a.v].soft, VERDICT[a.v].text)} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-[13.5px] font-bold">{a.id}</span>
                      <VerdictPill v={a.v} />
                    </span>
                    <span className="mt-1 block text-[12.5px] text-body">{a.desc}</span>
                  </span>
                  <span className="hidden text-xs whitespace-nowrap text-mute sm:block">{a.where}</span>
                  <ChevronRight size={17} className="text-mute" />
                </>
              )
              const cls = 'flex items-center gap-3.5 py-3.5'
              return (
                <li key={a.id} className="border-b border-line last:border-0">
                  {a.href ? (
                    <Link to={a.href} className={cx(cls, 'rounded-lg transition hover:bg-cream/60')}>
                      {row}
                    </Link>
                  ) : (
                    <div className={cls}>{row}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </>
  )
}
