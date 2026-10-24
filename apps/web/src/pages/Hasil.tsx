import { useEffect, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronRight, FileDown, Hand, Map as MapIcon, Send, Sheet, ShieldAlert, ShieldCheck, TriangleAlert, Upload } from 'lucide-react'
import { download, post, type Lot, type SampleRow, type Verdict } from '../lib/api'
import { labChecks, longDate, paginate, pct, shortDate } from '../lib/results'
import { useCurrentBatch } from '../lib/useCurrentBatch'
import { BatchBar, TopBar } from '../components/TopBar'
import { Card, Dark, Empty, Loading, Pager, Problem, TONE, VERDICT, VerdictPill, cx } from '../components/ui'

const COLS = ['ID sampel', 'Klaim', 'Vonis', 'Terbaca sebagai', 'Kebun entres', 'Tanggal']
const PAGE = 12
const ORDER: (Verdict | null)[] = ['OFF-TYPE', 'KONTAMINAN', 'BATANG BAWAH', 'TIDAK DIKENAL', 'UJI ULANG', 'BELUM ADA REFERENSI', 'COCOK', 'SESUAI SILANGAN', null]
const rank = (r: SampleRow) => ORDER.indexOf(r.verdict)
const garden = (p: string) => p.replace('KE Simulasi ', '') || '—'

function found(r: SampleRow) {
  if (r.found_as) return r.found_as
  if (r.verdict === 'UJI ULANG' && r.call_rate != null) return `DNA ${pct(r.call_rate, 0)}`
  if (r.verdict === 'TIDAK DIKENAL') return 'uji lanjutan diusulkan'
  if (!r.verdict) return r.call_rate == null ? 'menunggu lab' : 'belum dianalisis'
  return '—'
}

export default function Hasil() {
  const current = useCurrentBatch()
  const { batchId, batch } = current
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<Verdict | null>(null)
  const [page, setPage] = useState(1)
  const save = useMutation({ mutationFn: download })
  const qc = useQueryClient()
  // "Kirim tugas": a retest request per sample; the API groups them into one re-take task per garden for the phones.
  const sendRetest = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => post(`/batches/${batchId}/samples/${encodeURIComponent(id)}/action`, { action: 'uji ulang' }))),
    onSuccess: () => {
      for (const key of [['batch'], ['tasks'], ['dashboard']]) qc.invalidateQueries({ queryKey: key })
    },
  })

  // The notification bell links here with ?batch=<id>.
  useEffect(() => {
    const id = Number(params.get('batch'))
    if (id) {
      current.choose(id)
      setParams({}, { replace: true })
    }
  }, [params]) // eslint-disable-line react-hooks/exhaustive-deps

  const b = batch.data
  const field = (b?.samples ?? []).filter((r) => !r.is_control).sort((x, y) => rank(x) - rank(y) || x.sample_id.localeCompare(y.sample_id))
  const shown = paginate(filter ? field.filter((r) => r.verdict === filter) : field, page, PAGE)
  const counts = ORDER.filter((v): v is Verdict => !!v && !!b?.counts[v]).map((v) => [v, b!.counts[v]!] as const)
  const checks = labChecks(b?.qc ?? {})
  const controlsOk = b?.qc.control_results?.every((c) => c.ok)
  const retest = field.filter((r) => r.verdict === 'UJI ULANG')

  return (
    <>
      <TopBar
        crumb={['Verifikasi', 'Hasil verifikasi']}
        title={b?.name ?? 'Hasil verifikasi'}
        sub={
          b
            ? `${b.n_samples} sampel · ${b.analyzed_at ? `dianalisis ${longDate(b.analyzed_at)}` : 'belum dianalisis'}${b.lab_file ? ` · ${b.lab_file}` : ''}${controlsOk === undefined ? '' : controlsOk ? ' · kontrol plate lolos' : ' · kontrol plate bermasalah'}`
            : 'Vonis per sampel, lot benih, dan kualitas data lab'
        }
        secondary={{ icon: MapIcon, label: 'GeoJSON EUDR', onClick: () => save.mutate(`/batches/${batchId}/eudr.geojson`), disabled: !b?.analyzed_at, busy: save.isPending && save.variables?.endsWith('geojson') }}
        primary={{ icon: FileDown, label: 'Unduh berita acara', to: '/laporan' }}
      />

      {save.error && <Problem what="File" verb="diunduh" error={save.error} className="mt-4" />}
      <BatchBar current={current} />

      {current.batches.isError ? (
        <Problem what="Daftar batch" error={current.batches.error} className="mt-6" />
      ) : current.batches.data?.length === 0 ? (
        <Empty className="mt-6">Belum ada batch. Buat batch dan catat sampel dari halaman Ambil sampel di ponsel.</Empty>
      ) : batch.isError ? (
        <Problem what="Hasil batch" error={batch.error} className="mt-6" />
      ) : !b ? (
        <Loading label="Memuat hasil verifikasi…" className="mt-6" />
      ) : !b.analyzed_at ? (
        <Empty className="mt-6">
          {b.lab_file ? 'File lab sudah diunggah, verifikasi belum dijalankan.' : `${b.n_samples} sampel tercatat, hasil lab belum diunggah.`}{' '}
          <Link to="/unggah" className="inline-flex items-center gap-1 font-bold text-mint-deep hover:underline">
            <Upload size={14} /> Buka Unggah hasil lab
          </Link>
        </Empty>
      ) : (
        <>
          {b.qc.plate_shift && (
            <div role="alert" className="mt-5 flex gap-3 rounded-[18px] border border-bad/30 bg-bad-soft px-4 py-3.5 text-bad">
              <ShieldAlert size={20} className="mt-0.5 shrink-0" />
              <span className="text-[13px]">
                <b className="block">Sampel kemungkinan tergeser satu sumur di plate</b>
                {b.qc.plate_shift.message}
              </span>
            </div>
          )}
          {(b.qc.warnings ?? []).map((w) => (
            <p key={w} className="mt-3 flex gap-2.5 rounded-[16px] border border-warn/25 bg-warn-soft px-4 py-3 text-[12.5px] text-[#7A4A00]">
              <TriangleAlert size={16} className="mt-0.5 shrink-0 text-warn" /> {w}
            </p>
          ))}

          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            <Chip on={!filter} onClick={() => { setFilter(null); setPage(1) }}>
              Semua <span className={filter ? 'text-ink' : 'text-mint'}>{field.length}</span>
            </Chip>
            {counts.map(([v, n]) => (
              <button
                key={v}
                type="button"
                onClick={() => { setFilter(v === filter ? null : v); setPage(1) }}
                className={cx(
                  'flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10.5px] font-bold transition',
                  v === filter ? cx('border-transparent', VERDICT[v].soft) : 'border-line bg-white text-body hover:border-mute/40',
                )}
              >
                <span className="size-[7px] rounded-full" style={{ background: VERDICT[v].hex }} />
                {v} <span className={VERDICT[v].text}>{n}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => save.mutate(`/batches/${batchId}/results.csv`)}
              disabled={save.isPending}
              className="ml-auto flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[11.5px] font-bold hover:border-mute/40"
            >
              <Sheet size={14} className="text-mint-deep" /> CSV hasil + bukti per SNP
            </button>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="flex flex-col overflow-hidden rounded-[22px] border border-line bg-white p-2 pb-3">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left">
                  <thead>
                    <tr className="border-b border-line text-[10.5px] font-extrabold tracking-[0.08em] text-mute uppercase">
                      {COLS.map((c) => (
                        <th key={c} className="px-3.5 py-3 font-extrabold first:pl-4">
                          {c}
                        </th>
                      ))}
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {shown.rows.map((r) => {
                      const to = `/hasil/${batchId}/${encodeURIComponent(r.sample_id)}`
                      return (
                        <tr key={r.sample_id} className="border-b border-line text-[13px] last:border-0 hover:bg-cream/50">
                          <td className="py-2.5 pr-3.5 pl-4">
                            <Link to={to} className="block font-mono text-[12.5px] font-bold hover:underline">
                              {r.sample_id}
                            </Link>
                            <span className="text-[11px] text-mute">
                              {r.kind}
                              {r.closed_at ? (
                                <b className="ml-1.5 text-ok">· kasus ditutup</b>
                              ) : (
                                r.action && <b className="ml-1.5 text-mint-deep">· {r.action} dicatat</b>
                              )}
                            </span>
                          </td>
                          <td className="px-3.5 font-semibold">{r.claim}</td>
                          <td className="px-3.5">{r.verdict ? <VerdictPill v={r.verdict} /> : <span className="text-xs text-mute">—</span>}</td>
                          <td
                            className={cx(
                              'px-3.5',
                              r.verdict === 'OFF-TYPE' ? 'font-bold text-bad' : r.verdict === 'TIDAK DIKENAL' ? 'font-semibold text-bean' : 'text-body',
                            )}
                          >
                            {found(r)}
                          </td>
                          <td className="px-3.5 text-[12.5px] text-body">{garden(r.provider)}</td>
                          <td className="px-3.5 text-[12.5px] text-mute">{shortDate(r.date)}</td>
                          <td className="pr-3">
                            <Link to={to} aria-label={`Buka ${r.sample_id}`} className="grid size-7 place-items-center rounded-full hover:bg-white">
                              <ChevronRight size={16} className="text-mute" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 px-3.5 pt-3">
                <span className="text-[12.5px] text-mute">
                  Menampilkan {shown.rows.length} dari {filter ? `${field.filter((r) => r.verdict === filter).length} ${filter}` : `${field.length} sampel`}
                </span>
                <Pager page={shown.page} pages={shown.pages} onPage={setPage} />
              </div>
            </section>

            <div className="flex flex-col gap-5">
              {(b.qc.lots ?? []).map((l) => (
                <LotCard key={`${l.lot}${l.claim}`} lot={l} />
              ))}

              <Card className="flex flex-1 flex-col gap-3 px-[22px] py-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold">Kualitas data lab</h2>
                  {checks.some((c) => c.tone === 'bad') ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-bad-soft px-2.5 py-0.5 text-[10.5px] font-extrabold text-bad">
                      <ShieldAlert size={13} /> PERIKSA
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2.5 py-0.5 text-[10.5px] font-extrabold text-ok">
                      <ShieldCheck size={13} /> LOLOS
                    </span>
                  )}
                </div>
                {checks.map((q) => {
                  const t = TONE[q.tone]
                  return (
                    <div key={q.label} className="flex items-center gap-2.5 text-[12.5px]">
                      <t.icon size={16} className={t.text} />
                      <span className="flex-1 text-body">{q.label}</span>
                      <b className={q.tone === 'bad' ? 'text-bad' : undefined}>{q.value}</b>
                    </div>
                  )
                })}
                {retest.length > 0 && (
                  <div className="mt-auto rounded-2xl bg-cream p-3.5">
                    <p className="text-[12.5px] font-bold">Perlu daun baru</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {retest.map((r) => (
                        <Link key={r.sample_id} to={`/hasil/${batchId}/${encodeURIComponent(r.sample_id)}`} className="flex items-center gap-1.5 rounded-[9px] border border-line bg-white px-2 py-1">
                          <b className="font-mono text-[11.5px]">{r.sample_id}</b>
                          <span className="text-[11px] text-mute">DNA {r.call_rate == null ? '—' : pct(r.call_rate, 0)}</span>
                        </Link>
                      ))}
                    </div>
                    {retest.every((r) => r.action) ? (
                      <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] font-bold text-ok">
                        <Check size={14} /> Tugas ambil ulang sudah di ponsel pengawas
                      </p>
                    ) : (
                      <button
                        type="button"
                        disabled={sendRetest.isPending}
                        onClick={() => sendRetest.mutate(retest.filter((r) => !r.action).map((r) => r.sample_id))}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-choc py-2.5 text-[12.5px] font-bold text-white disabled:opacity-60"
                      >
                        <Send size={14} className="text-mint" /> Kirim tugas ke ponsel pengawas
                      </button>
                    )}
                    {sendRetest.error && <Problem what="Tugas" verb="dikirim" error={sendRetest.error} className="mt-2" />}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold', on ? 'bg-choc text-white' : 'border border-line bg-white text-body')}
    >
      {children}
    </button>
  )
}

const SCALE = 0.3 // lot meter runs 0–30%
const at = (v: number) => `${(Math.min(v, SCALE) / SCALE) * 100}%`
const LOT_TONE: Record<string, string> = { TAHAN: '#FF7A2F', LOLOS: '#2BD37A', 'TAMBAH SAMPEL': '#FFC24B' }

function LotCard({ lot: l }: { lot: Lot }) {
  const hex = LOT_TONE[l.decision] ?? '#B9A99C'
  if (l.estimate == null || !l.ci)
    return (
      <Card className="px-[22px] py-5">
        <span className="block text-[10.5px] font-extrabold tracking-[0.1em] text-mute">LOT HIBRIDA · {l.claim}</span>
        <span className="font-mono text-[17px] font-bold">{l.lot || 'tanpa lot'}</span>
        <p className="mt-2 text-[12.5px] text-body">
          <b>{l.decision}</b> · {l.n} bibit. {l.message}
        </p>
      </Card>
    )
  return (
    <Dark glows={[[hex, '100% 0%', '140% 100%']]} className="p-[22px]">
      <div className="flex items-start justify-between">
        <span>
          <span className="block text-[10.5px] font-extrabold tracking-[0.1em] text-white/50">LOT HIBRIDA</span>
          <span className="font-mono text-[17px] font-bold">{l.lot || 'tanpa lot'}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-extrabold tracking-wide text-choc" style={{ background: hex }}>
          {l.decision === 'TAHAN' && <Hand size={14} />} {l.decision}
        </span>
      </div>
      <div className="mt-3 flex items-end gap-2.5">
        <span className="font-display text-[52px] leading-[0.95] font-bold tracking-tight" style={{ color: hex }}>
          {pct(l.estimate, 0)}
        </span>
        <span className="pb-1 text-[13px] leading-tight font-semibold text-white/70">
          bibit
          <br />
          kontaminan
        </span>
      </div>
      <div className="relative mt-5 h-[22px]">
        <span className="absolute inset-x-0 top-2 h-1.5 rounded-full bg-white/10" />
        <span className="absolute top-1.5 h-2.5 rounded-full opacity-40" style={{ background: hex, left: at(l.ci[0]), width: `calc(${at(l.ci[1])} - ${at(l.ci[0])})` }} />
        <span className="absolute top-0 h-[22px] w-0.5 bg-mint" style={{ left: at(0.05) }} />
        <span className="absolute top-1 size-3.5 -translate-x-1/2 rounded-full border-[3px] border-choc" style={{ left: at(l.estimate), background: hex }} />
      </div>
      <div className="relative mt-1.5 h-4 text-[10.5px] font-semibold text-white/40">
        <span className="absolute left-0">0%</span>
        <span className="absolute -translate-x-1/3 text-mint" style={{ left: at(0.05) }}>
          5% batas
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: at(0.15) }}>
          15%
        </span>
        <span className="absolute right-0">30%</span>
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-white/70">
        {l.excluded} dari {l.n} bibit bukan anak {l.parents?.join(' × ') ?? l.claim}. Perkiraan kontaminasi {pct(l.estimate)} (rentang {pct(l.ci[0])}–{pct(l.ci[1])}),{' '}
        {l.decision === 'TAHAN' ? 'di atas batas 5%.' : l.decision === 'LOLOS' ? 'di bawah batas 5%.' : 'bibit yang diuji belum cukup untuk memutuskan.'}
      </p>
    </Dark>
  )
}
