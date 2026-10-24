import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight, BadgeCheck, ChevronRight, ClipboardCheck, Download, FlaskConical, GitBranch, GitCompareArrows, Leaf, PackageX, RotateCcw,
  SearchX, ShieldCheck, TestTubeDiagonal, TriangleAlert, Upload,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { get, type Dashboard, type Rate, type Verdict } from '../lib/api'
import { followUps, pct, shortDate, spread } from '../lib/results'
import { useCurrentBatch } from '../lib/useCurrentBatch'
import { TopBar } from '../components/TopBar'
import { Card, CardHead, Dark, Empty, IconTile, Loading, Meter, Overline, Problem, VERDICT, VerdictPill, cx } from '../components/ui'

const STEP_ICONS = [Leaf, FlaskConical, ShieldCheck, BadgeCheck, ClipboardCheck]
const ACTION_ICONS: Partial<Record<Verdict, LucideIcon>> = {
  'OFF-TYPE': GitCompareArrows,
  TAHAN: PackageX,
  'BATANG BAWAH': GitBranch,
  'TIDAK DIKENAL': SearchX,
  'UJI ULANG': RotateCcw,
}
const BAR: Verdict[] = ['COCOK', 'SESUAI SILANGAN', 'KONTAMINAN', 'OFF-TYPE', 'BELUM ADA REFERENSI', 'UJI ULANG', 'TIDAK DIKENAL', 'BATANG BAWAH']
const SHORT: Partial<Record<Verdict, string>> = { 'OFF-TYPE': 'off-type', KONTAMINAN: 'kontaminan', 'BATANG BAWAH': 'batang bawah', 'TIDAK DIKENAL': 'tak dikenal' }
const rateFill = (r: number) => (r >= 0.15 ? 'bg-bad' : r >= 0.1 ? 'bg-pod' : 'bg-ok')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function RateBars({ title, rows }: { title: string; rows: Rate[] }) {
  return (
    <div className="space-y-3.5">
      <Overline>{title}</Overline>
      {rows.map((r) => (
        <div key={r.name}>
          <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
            <span className="font-semibold">{cap(r.name)}</span>
            <span className="flex items-baseline gap-2">
              <span className="text-xs text-mute">
                {r.bad}/{r.n}
              </span>
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
  const dash = useQuery({ queryKey: ['dashboard'], queryFn: () => get<Dashboard>('/dashboard') })
  const { batchId, batch } = useCurrentBatch()
  const d = dash.data
  const b = batch.data
  const lots = b?.qc.lots ?? []
  const actions = followUps(b?.samples ?? [], lots)
  const held = lots.filter((l) => l.decision === 'TAHAN')
  const retestIds = (b?.samples ?? []).filter((s) => !s.is_control && s.verdict === 'UJI ULANG').map((s) => s.sample_id)
  const bar = BAR.filter((v) => d?.verdicts[v]).map((v) => [v, d!.verdicts[v]!] as const)

  if (dash.isError) return <Problem what="Dasbor" error={dash.error} />
  if (!d) return <Loading label="Memuat dasbor…" />

  const kpi: { label: string; value: number; note: string; icon: LucideIcon; tone: string; valueTone?: string }[] = [
    {
      label: 'Sampel diuji', value: d.samples, icon: TestTubeDiagonal, tone: 'bg-mint-soft text-mint-deep',
      note: `${d.by_provider.length} kebun entres · ${d.by_province.length} provinsi`,
    },
    {
      label: 'Bermasalah', value: d.bad, icon: TriangleAlert, tone: 'bg-bad-soft text-bad', valueTone: 'text-bad',
      note: Object.entries(SHORT).filter(([v]) => d.verdicts[v as Verdict]).map(([v, l]) => `${d.verdicts[v as Verdict]} ${l}`).join(' · ') || 'tidak ada',
    },
    {
      label: 'Lot ditahan', value: d.lots_held, icon: PackageX, tone: 'bg-kontam-soft text-kontam', valueTone: 'text-kontam',
      note: held.length ? held.map((l) => `${l.lot} · ${pct(l.estimate ?? 0, 0)} bibit kontaminan`).join(' · ') : 'tidak ada lot ditahan',
    },
    {
      label: 'Perlu uji ulang', value: d.retest, icon: RotateCcw, tone: 'bg-taupe-soft text-taupe', valueTone: 'text-taupe',
      note: retestIds.length ? `${retestIds.slice(0, 3).join(' · ')} · DNA terbaca < 85%` : 'DNA terbaca < 85%',
    },
  ]
  const journey = [
    { label: 'Daun diambil', value: String(d.samples), sub: `${d.by_provider.length} kebun entres` },
    { label: 'Diterima lab', value: String(d.lab_received), sub: d.awaiting_lab ? `${d.awaiting_lab} menunggu lab` : 'semua sampel' },
    { label: 'Lolos QC data lab', value: String(d.qc_passed), sub: `${d.lab_received - d.qc_passed} perlu daun ulang` },
    { label: 'Ada vonis', value: String(d.verified), sub: d.no_reference ? `${d.no_reference} klon belum ada referensi` : 'semua bisa divonis' },
    {
      label: 'Tindak lanjut selesai', value: `${d.follow_up_done}/${d.follow_up}`,
      sub: d.follow_up_running ? `${d.follow_up_running} sedang berjalan` : d.follow_up_done < d.follow_up ? 'menunggu pengawas' : 'semua kasus ditutup',
    },
  ]

  return (
    <>
      <TopBar
        crumb={['Verifikasi', 'Dasbor']}
        title="Dasbor verifikasi"
        sub={`${d.batches} batch · ${d.samples} sampel${b?.analyzed_at ? ` · hasil lab terakhir ${shortDate(b.analyzed_at)}` : ''}`}
        secondary={{ icon: Upload, label: 'Unggah hasil lab', to: '/unggah' }}
        primary={{ icon: Download, label: 'Unduh laporan', to: '/laporan' }}
      />

      {d.samples === 0 ? (
        <Empty className="mt-6">
          Belum ada sampel. Mulai dari{' '}
          <Link to="/m/ambil" className="font-bold text-mint-deep hover:underline">
            Ambil sampel
          </Link>{' '}
          di ponsel pengawas.
        </Empty>
      ) : (
        <>
          <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
            <Dark glows={[['#3DDC97', '95% 5%', '80% 120%'], ['#FF8A3D', '5% 100%', '70% 90%']]} className="flex flex-col justify-between gap-7 p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold tracking-[0.08em] text-white/80">
                  <span className="relative flex size-[7px]">
                    <span className="absolute inset-0 animate-ping rounded-full bg-mint opacity-60" />
                    <span className="size-[7px] rounded-full bg-mint" />
                  </span>
                  VERIFIKASI BIBIT · {d.by_province.length} PROVINSI
                </span>
                <span className="text-[12.5px] text-white/50">
                  {d.batches} batch · {d.by_provider.length} kebun entres
                </span>
              </div>
              <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
                <p className="font-display text-[clamp(72px,8vw,108px)] leading-[0.9] font-bold tracking-[-0.04em] text-mint">
                  {d.verified_ok_rate == null ? '—' : pct(d.verified_ok_rate)}
                </p>
                <div className="pb-2.5">
                  <p className="text-xl leading-tight font-bold">
                    sampel terverifikasi
                    <br />
                    sesuai klaim
                  </p>
                  <p className="mt-1.5 text-[13px] text-white/60">
                    {d.ok} dari {d.verified} sampel dengan vonis
                  </p>
                </div>
              </div>
              <div>
                <div className="flex h-4 gap-[3px]">
                  {bar.map(([v, n]) => (
                    <div key={v} title={`${v}: ${n}`} className="min-w-1 rounded" style={{ flex: `${n} 1 0`, background: VERDICT[v].hex }} />
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-4">
                  {bar.map(([v, n]) => (
                    <span key={v} className="flex items-center gap-1.5 text-[11px] font-semibold whitespace-nowrap text-white/65">
                      <span className="size-2 shrink-0 rounded-[3px]" style={{ background: VERDICT[v].hex }} />
                      {v} <b className="text-white">{n}</b>
                    </span>
                  ))}
                </div>
              </div>
            </Dark>

            <div className="grid grid-cols-2 gap-5">
              {kpi.map((k) => (
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
              {journey.map((s, i) => {
                const Icon = STEP_ICONS[i]
                const last = i === journey.length - 1
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
              <RateBars title="Per provinsi" rows={d.by_province} />
              <RateBars title="Per jenis sampel" rows={d.by_kind} />
            </Card>

            <Card className="pb-3">
              <CardHead
                title="Perlu tindakan"
                sub={b ? `${b.name} · satu contoh per jenis, dari dampak terbesar` : 'Satu contoh per jenis, dari dampak terbesar'}
                right={
                  <Link to="/hasil" className="inline-flex items-center gap-1 text-[13px] font-bold whitespace-nowrap text-mint-deep hover:underline">
                    Lihat semua {d.follow_up} <ArrowRight size={15} />
                  </Link>
                }
              />
              {batch.isError && <Problem what="Batch" error={batch.error} className="mt-3" />}
              {b && !actions.length && <Empty className="mt-3">Tidak ada yang perlu ditindaklanjuti di batch ini.</Empty>}
              <ul className="mt-2">
                {spread(actions, 5).map((a) => {
                  const Icon = ACTION_ICONS[a.v] ?? TriangleAlert
                  return (
                    <li key={a.id} className="border-b border-line last:border-0">
                      <Link
                        to={a.sample ? `/hasil/${batchId}/${encodeURIComponent(a.id)}` : '/hasil'}
                        className="flex items-center gap-3.5 rounded-lg py-3.5 transition hover:bg-cream/60"
                      >
                        <IconTile icon={Icon} className={cx(VERDICT[a.v].soft, VERDICT[a.v].text)} />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2.5">
                            <span className="font-mono text-[13.5px] font-bold">{a.id}</span>
                            <VerdictPill v={a.v} />
                          </span>
                          <span className="mt-1 block text-[12.5px] text-body">
                            {a.text}
                            {a.sample?.action && <b className="text-mint-deep"> · {a.sample.action} dicatat</b>}
                          </span>
                        </span>
                        {a.sample && (
                          <span className="hidden text-xs whitespace-nowrap text-mute sm:block">
                            {a.sample.provider.replace('KE Simulasi ', 'KE ')} · {shortDate(a.sample.date)}
                          </span>
                        )}
                        <ChevronRight size={17} className="text-mute" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </Card>
          </div>
        </>
      )}
    </>
  )
}
