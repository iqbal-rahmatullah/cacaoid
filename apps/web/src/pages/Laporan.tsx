import { useState } from 'react'
import { useMutation, useQueries, useQuery } from '@tanstack/react-query'
import { BadgeCheck, Download, FileDown, Link as LinkIcon, Map as MapIcon, MapPin, Printer, Sheet, Sprout, Trees, Unlink } from 'lucide-react'
import { download, get, type Audit, type AuditEvent, type Compare, type Passport, type Verdict } from '../lib/api'
import { yieldImpact } from '../lib/field'
import { BAD, OK, clock, followUps, longDate, num, pct, recap, shortDate } from '../lib/results'
import { useCurrentBatch } from '../lib/useCurrentBatch'
import { BatchSelect, TopBar } from '../components/TopBar'
import { Card, Dark, Empty, IconTile, Loading, Problem, VERDICT, cx, useSimulated } from '../components/ui'

const VERDICTS: Verdict[] = ['COCOK', 'SESUAI SILANGAN', 'KONTAMINAN', 'OFF-TYPE', 'BELUM ADA REFERENSI', 'UJI ULANG', 'TIDAK DIKENAL', 'BATANG BAWAH']
const EVENT: Record<string, string> = {
  'batch.dibuat': 'Batch dibuat',
  'sampel.dicatat': 'Sampel dicatat di lapangan',
  'lab.diunggah': 'Hasil lab diunggah',
  'analisis.dijalankan': 'Verifikasi dijalankan',
  'tindakan.uji ulang': 'Minta uji ulang',
  'tindakan.pemurnian': 'Ditandai untuk pemurnian',
}
const AUDIT_SHOWN = 8

function eventDetail(e: AuditEvent) {
  const p = e.payload
  if (e.action === 'batch.dibuat') return `${p.samples} sampel lapangan`
  if (e.action === 'lab.diunggah') return `${p.file} · sha256 ${String(p.sha256).slice(0, 8)}…`
  if (e.action === 'analisis.dijalankan') return `${Object.values(p.counts as Record<string, number>).reduce((a, b) => a + b, 0)} vonis tercatat`
  return [e.sample_id, p.verdict].filter(Boolean).join(' · ') || e.actor
}

export default function Laporan() {
  const current = useCurrentBatch()
  const { batchId, batch } = current
  const simulated = useSimulated()
  const [view, setView] = useState<'acara' | 'mitra'>('acara')
  const [chosen, setChosen] = useState('')
  const save = useMutation({ mutationFn: download })
  const audit = useQuery({ queryKey: ['audit', batchId], enabled: !!batchId, queryFn: () => get<Audit>(`/audit?batch_id=${batchId}`) })

  const b = batch.data
  const field = (b?.samples ?? []).filter((s) => !s.is_control)
  const lots = b?.qc.lots ?? []
  const items = followUps(field, lots)
  const needing = field.filter((s) => s.verdict && (BAD.has(s.verdict) || s.verdict === 'UJI ULANG' || s.verdict === 'BELUM ADA REFERENSI')).length
  // Section 3 needs a mix-up that a field trial actually measured: the first off-type whose two clones were grown side by side.
  const offTypes = field.filter((s) => s.verdict === 'OFF-TYPE' && s.found_as)
  const compares = useQueries({
    queries: offTypes.map((s) => ({
      queryKey: ['compare', s.claim, s.found_as],
      queryFn: () => get<Compare>(`/traits/compare?paid=${encodeURIComponent(s.claim)}&received=${encodeURIComponent(s.found_as!)}`),
    })),
  })
  const measured = offTypes.map((s, i) => ({ s, impact: compares[i].data ? yieldImpact(compares[i].data) : null })).find((m) => m.impact)
  const offType = measured?.s ?? offTypes[0]
  const impact = measured?.impact ?? null
  const comparing = compares.some((c) => c.isPending)
  const passports = field.filter((s) => s.verdict && OK.has(s.verdict) && s.lat != null)
  const pass = passports.find((s) => s.sample_id === chosen) ?? passports[0]
  const passport = useQuery({
    queryKey: ['passport', batchId, pass?.sample_id],
    enabled: !!pass,
    staleTime: Infinity, // the EUDR map lookup takes seconds and the answer does not change
    queryFn: () => get<Passport>(`/batches/${batchId}/samples/${encodeURIComponent(pass!.sample_id)}/passport`),
  })
  const gardens = new Set(field.map((s) => s.provider).filter(Boolean))
  const provinces = [...new Set(field.map((s) => s.province).filter(Boolean))]
  const controls = (b?.samples ?? []).filter((s) => s.is_control).length
  const controlsOk = b?.qc.control_results?.every((c) => c.ok)
  const partner = recap(field, lots)
  const events = audit.data?.events ?? []

  return (
    <>
      <TopBar
        crumb={['AI & laporan', <BatchSelect current={current} />]}
        title={view === 'acara' ? 'Berita acara verifikasi' : 'Rekap untuk mitra'}
        sub={view === 'acara' ? `${b?.name ?? 'Batch'} · siap ditandatangani pengawas benih & kepala UPTD` : 'Ringkasan per kebun dan per lot benih untuk perusahaan mitra'}
        secondary={{ icon: Printer, label: 'Cetak', onClick: () => window.print(), disabled: !b?.analyzed_at }}
        primary={{ icon: FileDown, label: 'Simpan PDF', onClick: () => window.print(), disabled: !b?.analyzed_at }}
      />
      {save.error && <Problem what="File" verb="diunduh" error={save.error} className="mt-4 print:hidden" />}

      {current.batches.isError ? (
        <Problem what="Daftar batch" error={current.batches.error} className="mt-6" />
      ) : current.batches.data?.length === 0 ? (
        <Empty className="mt-6">Belum ada batch untuk dilaporkan.</Empty>
      ) : batch.isError ? (
        <Problem what="Batch" error={batch.error} className="mt-6" />
      ) : !b ? (
        <Loading className="mt-6" />
      ) : !b.analyzed_at ? (
        <Empty className="mt-6">Berita acara tersedia setelah hasil lab diunggah dan verifikasi dijalankan.</Empty>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] print:mt-0 print:block">
          <div className="flex flex-col rounded-[24px] bg-desk px-4 pt-5 sm:px-10 print:bg-white print:p-0">
            <div className="mx-auto mb-4 flex gap-1 rounded-full bg-white/70 p-1 text-xs font-bold print:hidden">
              {(
                [
                  ['acara', 'Berita acara'],
                  ['mitra', 'Rekap mitra'],
                ] as const
              ).map(([k, l]) => (
                <button key={k} type="button" onClick={() => setView(k)} className={cx('rounded-full px-4 py-1.5', view === k ? 'bg-choc text-white' : 'text-body')}>
                  {l}
                </button>
              ))}
            </div>
            <article className="mx-auto flex min-h-[760px] w-full max-w-[720px] flex-1 flex-col gap-4 rounded-t-md bg-white px-6 py-8 text-[11px] shadow-[0_10px_30px_rgba(61,42,31,0.15)] sm:px-[38px] print:max-w-none print:shadow-none">
              <header className="flex items-start justify-between gap-4 border-b-2 border-ink pb-3.5">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-[10px] bg-choc text-mint">
                    <Sprout size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-extrabold tracking-wide">
                      {view === 'acara' ? 'BERITA ACARA VERIFIKASI BENIH KAKAO' : 'REKAP VERIFIKASI BENIH UNTUK MITRA'}
                    </span>
                    <span className="text-[10.5px] text-body">Verifikasi identitas klon berbasis sidik jari DNA (panel {b.qc.panel_used?.length ?? 48} SNP)</span>
                  </span>
                </div>
                {simulated && (
                  <span className="-rotate-4 rounded-md border-[1.5px] border-warn px-2.5 py-1 text-[10px] font-extrabold tracking-widest text-warn">DATA SIMULASI</span>
                )}
              </header>

              <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {[
                  ['Batch', b.name],
                  ['Sampel', `${b.n_samples}${controls ? ` + ${controls} kontrol` : ''}`],
                  ['Dianalisis', longDate(b.analyzed_at)],
                  ['Kebun entres', `${gardens.size}${provinces.length ? ` · ${provinces.length} provinsi` : ''}`],
                  ['File lab', b.lab_file ?? '—'],
                  ['Kontrol plate', controlsOk === undefined ? '—' : controlsOk ? 'lolos' : 'bermasalah'],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="w-[86px] shrink-0 text-mute">{k}</dt>
                    <dd className="font-bold">{v}</dd>
                  </div>
                ))}
              </dl>

              {view === 'acara' ? (
                <>
                  <h3 className="text-xs font-extrabold">1. Ringkasan vonis</h3>
                  <div className="grid overflow-hidden rounded-md border border-line sm:grid-cols-2">
                    {VERDICTS.filter((v) => b.counts[v]).map((v) => (
                      <div key={v} className="flex items-center justify-between border-b border-line px-2.5 py-1.5 sm:odd:border-r">
                        <span className="flex items-center gap-1.5 text-[10.5px] font-bold text-body">
                          <span className="size-1.5 rounded-full" style={{ background: VERDICT[v].hex }} />
                          {v}
                        </span>
                        <b>{b.counts[v]}</b>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-xs font-extrabold">2. Perlu tindak lanjut ({needing} sampel)</h3>
                  {items.length ? (
                    items.map((i) => (
                      <p key={i.id} className="flex gap-2.5 text-[10.5px]">
                        <b className="w-[70px] shrink-0 font-mono">{i.id}</b>
                        <span className="text-body">
                          {i.v} · {i.text}
                          {i.sample?.action && <b className="text-ink"> · tindak lanjut dicatat: {i.sample.action}</b>}
                        </span>
                      </p>
                    ))
                  ) : (
                    <p className="text-[10.5px] text-body">Tidak ada. Semua sampel sesuai klaim.</p>
                  )}

                  <h3 className="text-xs font-extrabold">3. Dampak salah klon menurut uji lapang</h3>
                  <p className="text-[10.5px] leading-relaxed text-body">
                    {!offType
                      ? 'Tidak ada pohon yang terbukti klon lain di batch ini.'
                      : comparing && !impact
                        ? 'Memuat fakta uji lapang…'
                        : impact
                          ? `Pohon ${offType.sample_id}: petani membayar ${offType.claim} (${num(impact.paid)} kg/ha/thn) namun menerima ${offType.found_as} (${num(impact.received)} kg/ha/thn), ${impact.pct > 0 ? '+' : '−'}${Math.abs(impact.pct)}% pada uji lapang ${impact.source} di ${impact.site}.`
                          : `Pohon ${offType.sample_id} (label ${offType.claim}, DNA ${offType.found_as}): belum ada uji lapang yang membandingkan kedua klon, jadi dampaknya tidak ditulis.`}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-xs font-extrabold">1. Per kebun entres</h3>
                  <table className="w-full text-left text-[10.5px]">
                    <thead className="border-b border-ink text-mute">
                      <tr>
                        {['Kebun', 'Sampel', 'Terverifikasi', 'Sesuai', 'Bermasalah', 'Tingkat'].map((h, i) => (
                          <th key={h} className={cx('py-1.5 font-bold', i > 0 && 'text-right')}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {partner.gardens.map((g) => (
                        <tr key={g.name} className="border-b border-line">
                          <td className="py-1.5 font-bold">{g.name}</td>
                          {[g.n, g.verified, g.ok, g.bad, g.verified ? pct(g.rate) : '—'].map((v, i) => (
                            <td key={i} className={cx('py-1.5 text-right', i === 4 && g.rate >= 0.1 && 'font-bold text-bad')}>
                              {v}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <h3 className="text-xs font-extrabold">2. Per lot benih hibrida</h3>
                  {partner.lots.length ? (
                    <table className="w-full text-left text-[10.5px]">
                      <thead className="border-b border-ink text-mute">
                        <tr>
                          {['Lot', 'Klaim', 'Bibit', 'Bukan anak silangan', 'Perkiraan kontaminasi', 'Keputusan'].map((h, i) => (
                            <th key={h} className={cx('py-1.5 font-bold', i > 1 && 'text-right')}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {partner.lots.map((l) => (
                          <tr key={`${l.lot}${l.claim}`} className="border-b border-line">
                            <td className="py-1.5 font-mono font-bold">{l.lot || '—'}</td>
                            <td className="py-1.5">{l.claim}</td>
                            <td className="py-1.5 text-right">{l.n}</td>
                            <td className="py-1.5 text-right">{l.excluded ?? '—'}</td>
                            <td className="py-1.5 text-right">{l.estimate == null ? '—' : `${pct(l.estimate)}${l.ci ? ` (${pct(l.ci[0])}–${pct(l.ci[1])})` : ''}`}</td>
                            <td className={cx('py-1.5 text-right font-extrabold', l.decision === 'TAHAN' && 'text-kontam')}>{l.decision}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-[10.5px] text-body">Tidak ada lot benih hibrida di batch ini.</p>
                  )}
                  <p className="text-[10.5px] leading-relaxed text-body">
                    Tingkat bermasalah = sampel bukan klon yang diklaim dibagi sampel yang sudah punya vonis. Sampel UJI ULANG dan BELUM ADA REFERENSI belum dihitung. Vonis per
                    sampel beserta bukti per SNP ada di CSV hasil.
                  </p>
                </>
              )}

              <footer className="mt-auto flex items-end gap-6 pt-10">
                {['Pengawas benih', 'Kepala UPTD BPSBP'].map((r) => (
                  <div key={r} className="flex-1 border-t border-ink pt-1.5 text-[10.5px] font-bold">
                    {r}
                  </div>
                ))}
                <div className="max-w-[150px] text-right text-[9px] leading-snug text-mute">
                  Rantai hash audit {audit.data ? (audit.data.chain.ok ? 'utuh' : 'RUSAK') : '…'}
                  <span className="block font-mono">{audit.data?.chain.head?.slice(0, 16) ?? ''}</span>
                </div>
              </footer>
            </article>
          </div>

          <div className="flex flex-col gap-5 print:hidden">
            <Dark glows={[['#3DDC97', '100% 0%', '140% 120%']]} className="flex flex-col gap-3.5 p-[22px]">
              <div>
                <span className="block text-[10.5px] font-extrabold tracking-[0.12em] text-mint">PASPOR BIBIT</span>
                {passports.length ? (
                  <select
                    aria-label="Sampel untuk paspor"
                    value={pass?.sample_id}
                    onChange={(e) => setChosen(e.target.value)}
                    className="mt-1 w-full rounded-lg bg-white/10 px-2 py-1 font-mono text-lg font-bold text-white outline-none"
                  >
                    {passports.map((s) => (
                      <option key={s.sample_id} value={s.sample_id} className="text-ink">
                        {s.sample_id} · {s.claim}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 text-[12.5px] text-white/60">Belum ada sampel terverifikasi DNA yang punya GPS.</p>
                )}
                {pass && (
                  <span className="text-[11.5px] text-white/50">
                    {pass.kind} · {pass.provider.replace('KE Simulasi ', 'KE ')}
                  </span>
                )}
              </div>
              {pass &&
                (passport.isPending ? (
                  <p className="text-[12.5px] text-white/60">Memeriksa peta tutupan hutan…</p>
                ) : passport.isError ? (
                  <Problem what="Paspor" error={passport.error} />
                ) : (
                  <>
                    {[
                      { icon: BadgeCheck, label: 'Identitas klon', value: `${passport.data.identity.verdict} · ${passport.data.identity.claim}`, tone: 'text-mint' },
                      {
                        icon: Trees,
                        label: 'Risiko deforestasi (EUDR)',
                        value: passport.data.eudr?.verdict ?? '—',
                        tone: passport.data.eudr?.verdict === 'RENDAH' ? 'text-mint' : 'text-[#FFC24B]',
                      },
                      {
                        icon: MapPin,
                        label: 'Titik tanam',
                        value: passport.data.plot ? passport.data.plot.coordinates.slice().reverse().map((c) => c.toFixed(4).replace('.', ',').replace('-', '−')).join(' · ') : '—',
                        tone: 'text-white',
                      },
                    ].map(({ icon: Icon, label, value, tone }) => (
                      <div key={label} className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2.5">
                        <Icon size={16} className={tone} />
                        <span>
                          <span className="block text-[11px] text-white/50">{label}</span>
                          <span className={`text-[13px] font-extrabold ${tone}`}>{value}</span>
                        </span>
                      </div>
                    ))}
                    <p className="text-[10.5px] leading-relaxed text-white/45">
                      {passport.data.eudr?.reasons.at(-1) ?? passport.data.message} Alat skrining, bukan putusan.
                    </p>
                  </>
                ))}
            </Dark>

            <Card className="px-[18px] pt-[18px] pb-2.5">
              <h2 className="font-display text-[17px] font-bold">Ekspor</h2>
              {[
                { icon: MapIcon, label: 'GeoJSON EUDR', detail: 'Titik tanam bibit terverifikasi', path: `/batches/${batchId}/eudr.geojson` },
                { icon: Sheet, label: 'CSV hasil', detail: `${field.length} vonis + bukti per SNP`, path: `/batches/${batchId}/results.csv` },
              ].map(({ icon, label, detail, path }) => (
                <button key={label} type="button" onClick={() => save.mutate(path)} disabled={save.isPending} className="flex w-full items-center gap-3 py-2.5 text-left">
                  <IconTile icon={icon} size="sm" className="bg-cream text-body" />
                  <span className="flex-1">
                    <span className="block text-[13px] font-bold">{label}</span>
                    <span className="text-[11.5px] text-mute">{detail}</span>
                  </span>
                  <Download size={16} className="text-mint-deep" />
                </button>
              ))}
            </Card>

            <Card className="flex-1 p-[18px]">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[17px] font-bold">
                  Jejak audit <span className="text-[11px] font-semibold text-mute">· waktu WITA</span>
                </h2>
                {audit.data &&
                  (audit.data.chain.ok ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2.5 py-0.5 text-[10.5px] font-extrabold text-ok">
                      <LinkIcon size={12} /> rantai hash utuh
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-bad-soft px-2.5 py-0.5 text-[10.5px] font-extrabold text-bad">
                      <Unlink size={12} /> rantai putus di #{audit.data.chain.broken_at}
                    </span>
                  ))}
              </div>
              {audit.isError && <Problem what="Jejak audit" error={audit.error} className="mt-3" />}
              {events.length > AUDIT_SHOWN && <p className="mt-2 text-[11px] text-mute">{events.length - AUDIT_SHOWN} kejadian sebelumnya tidak ditampilkan</p>}
              <ol className="mt-3 space-y-3">
                {events.slice(-AUDIT_SHOWN).map((e) => (
                  <li key={e.id} className="flex gap-2.5">
                    <span className="mt-1 size-[9px] shrink-0 rounded-full bg-mint-deep" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-bold">{EVENT[e.action] ?? e.action}</span>
                      <span className="block truncate text-[11px] text-mute">{eventDetail(e)}</span>
                    </span>
                    <span className="text-right font-mono text-[10.5px] text-mute">
                      {clock(e.ts)}
                      <span className="block">{shortDate(e.ts)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
