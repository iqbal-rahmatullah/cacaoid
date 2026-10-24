import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight, BookOpen, Calendar, Check, Dna, Flag, Info, LocateFixed, MapPin, Package, Rows3, RotateCcw, Tag, TriangleAlert, Warehouse, X,
} from 'lucide-react'
import { get, post, type Compare, type SampleDetail } from '../lib/api'
import { headline, yieldImpact } from '../lib/field'
import { longDate, num, pct, toCells } from '../lib/results'
import { TopBar } from '../components/TopBar'
import { Card, CardHead, Dark, Empty, Fingerprint, GENOTYPE, Loading, Problem, VERDICT, VERDICT_ICON, cx } from '../components/ui'

const ACTIONABLE = ['OFF-TYPE', 'BATANG BAWAH', 'TIDAK DIKENAL', 'KONTAMINAN', 'UJI ULANG']
const coord = (x: number) => x.toFixed(4).replace('.', ',').replace('-', '−')

export default function Sampel() {
  const { batchId, sampleId } = useParams()
  const qc = useQueryClient()
  const key = ['sample', batchId, sampleId]
  const sample = useQuery({ queryKey: key, queryFn: () => get<SampleDetail>(`/batches/${batchId}/samples/${encodeURIComponent(sampleId!)}`) })
  const s = sample.data
  const differs = !!s?.found_as && s.found_as !== s.claim
  const compare = useQuery({
    queryKey: ['compare', s?.claim, s?.found_as],
    enabled: differs,
    queryFn: () => get<Compare>(`/traits/compare?paid=${encodeURIComponent(s!.claim)}&received=${encodeURIComponent(s!.found_as!)}`),
  })
  const act = useMutation({
    mutationFn: (action: 'uji ulang' | 'pemurnian') => post(`/batches/${batchId}/samples/${encodeURIComponent(sampleId!)}/action`, { action }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key })
      qc.invalidateQueries({ queryKey: ['batch'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  if (sample.isPending) return <Loading label={`Memuat ${sampleId}…`} />
  if (sample.isError)
    return (
      <div className="mx-auto mt-16 max-w-md space-y-4 text-center">
        <Problem what={`Sampel ${sampleId}`} error={sample.error} />
        <Link to="/hasil" className="text-sm font-bold text-mint-deep hover:underline">
          Kembali ke Hasil verifikasi
        </Link>
      </div>
    )

  const x = sample.data
  const v = x.verdict
  const r = x.result
  const unit = x.kind.startsWith('bibit') ? 'bibit' : 'pohon'
  const canAct = !!v && ACTIONABLE.includes(v) && !x.action
  const rows = r.compare ?? []
  const cells = toCells(rows)
  const read = rows.filter((c) => c.sample).length
  const best = r.candidates?.find((c) => c.name === x.found_as)
  const impact = compare.data ? yieldImpact(compare.data) : null
  const traits = (compare.data?.same_trial ?? []).filter((t) => t.pct !== null && !t.label.startsWith('Hasil (kg/ha')).slice(0, 4)
  const hex = v ? VERDICT[v].hex : '#B9A99C'
  const Icon = v ? VERDICT_ICON[v] : Info
  const fieldRows: [LucideIcon, string, string][] = [
    [Warehouse, 'Kebun', x.provider || '—'],
    [MapPin, 'Lokasi', [x.regency, x.province].filter(Boolean).join(', ') || '—'],
    [LocateFixed, 'GPS', x.lat != null && x.lon != null ? `${coord(x.lat)} · ${coord(x.lon)}` : 'tidak ada'],
    [Calendar, 'Diambil', `${longDate(x.date)}${x.officer ? ` · ${x.officer}` : ''}`],
    [Package, 'Lot / kantong', `${x.lot || '—'}${x.lab_row != null ? ` · baris lab ${x.lab_row}` : ''}`],
    ...(x.position ? [[Rows3, 'Posisi pohon', x.position] as [LucideIcon, string, string]] : []),
  ]

  return (
    <>
      <TopBar
        crumb={['Hasil verifikasi', <Link to="/hasil" className="hover:underline">{x.batch_name}</Link>]}
        title={`${x.sample_id} · ${x.kind}`}
        sub={`${x.provider || 'Tanpa kebun'} · diambil ${longDate(x.date)}${x.officer ? ` oleh ${x.officer}` : ''}`}
        secondary={canAct ? { icon: RotateCcw, label: 'Minta uji ulang', onClick: () => act.mutate('uji ulang'), busy: act.isPending && act.variables === 'uji ulang' } : undefined}
        primary={canAct && v !== 'UJI ULANG' ? { icon: Flag, label: `Tandai ${unit}`, onClick: () => act.mutate('pemurnian'), busy: act.isPending && act.variables === 'pemurnian' } : undefined}
      />
      {act.error && <Problem what="Tindak lanjut" verb="dicatat" error={act.error} className="mt-4" />}
      {x.action && (
        <p role="status" className="mt-4 flex items-center gap-2 rounded-2xl bg-ok-soft px-4 py-3 text-[13px] font-semibold text-ok">
          <Check size={16} /> Tindak lanjut tercatat di jejak audit: {x.action === 'pemurnian' ? `${unit} ditandai untuk diganti` : 'minta uji ulang'}
        </p>
      )}

      {!v ? (
        <Empty className="mt-6">{x.call_rate == null ? 'Sampel sudah tercatat, hasil lab belum masuk.' : 'Hasil lab sudah masuk, verifikasi belum dijalankan.'}</Empty>
      ) : (
        <>
          <Dark glows={[[hex, '0% 0%', '110% 160%'], ['#3DDC97', '100% 100%', '80% 140%']]} className="mt-6 grid items-center gap-8 p-[30px] xl:grid-cols-[minmax(0,1fr)_440px]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-extrabold tracking-[0.08em]" style={{ color: hex, borderColor: `${hex}66`, background: `${hex}26` }}>
                <Icon size={16} /> {v}
              </span>
              <h2 className="mt-3.5 font-display text-[40px] leading-[1.05] font-bold tracking-[-0.03em]">{headline(v, x.claim, x.found_as)}</h2>
              <p className="mt-3.5 max-w-2xl text-sm leading-relaxed text-white/70">
                {r.parentage
                  ? `${r.parentage.exclusions} eksklusi dari ${r.parentage.compared} SNP terhadap tetua ${r.parentage.parents.join(' × ')} (batas ${r.parentage.allowed}, LOD ${String(r.parentage.lod).replace('.', ',')}).`
                  : r.mismatches != null && r.compared != null
                    ? `${r.mismatches} dari ${r.compared} titik DNA berbeda dari ${x.claim}; error lab wajar paling banyak ${r.allowed}.` +
                      (differs && best ? ` Sidik jarinya ${best.mismatches === 0 ? 'sama persis' : `paling dekat (${best.mismatches} beda)`} dengan ${x.found_as} di registri.` : '')
                    : r.steps?.at(-1)?.detail}
              </p>
            </div>
            <div className="space-y-3.5">
              {differs && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-[18px] border border-[#FF5A5F]/35 bg-white/[0.04] p-[18px]">
                    <span className="flex items-center gap-1.5 text-[10.5px] font-extrabold tracking-[0.1em] text-[#FF8F92]">
                      <Tag size={13} /> DIKLAIM
                    </span>
                    <p className="mt-1.5 font-display text-[28px] leading-none font-bold">{x.claim}</p>
                    <p className="mt-1.5 text-xs text-white/55">
                      {r.mismatches} beda dari {r.compared}
                    </p>
                  </div>
                  <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-white/10">
                    <ArrowRight size={17} />
                  </span>
                  <div className="flex-1 rounded-[18px] border border-mint/40 bg-mint/10 p-[18px]">
                    <span className="flex items-center gap-1.5 text-[10.5px] font-extrabold tracking-[0.1em] text-mint">
                      <Dna size={13} /> DITEMUKAN
                    </span>
                    <p className="mt-1.5 font-display text-[28px] leading-none font-bold">{x.found_as}</p>
                    {best && (
                      <p className="mt-1.5 text-xs text-white/55">
                        {best.mismatches} beda dari {best.compared}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  [x.call_rate == null ? '—' : pct(x.call_rate, 0), rows.length ? `DNA terbaca (${read}/${rows.length})` : 'DNA terbaca'],
                  [r.allowed != null ? `≤ ${r.allowed}` : r.parentage ? `≤ ${r.parentage.allowed}` : '—', r.parentage ? 'eksklusi yang wajar' : 'beda yang wajar'],
                  [String(r.compared ?? r.parentage?.compared ?? '—'), 'SNP dibandingkan'],
                ].map(([val, l]) => (
                  <div key={l} className="rounded-[14px] bg-white/5 px-3.5 py-2.5">
                    <p className="font-display text-xl font-bold">{val}</p>
                    <p className="text-[11px] text-white/50">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </Dark>

          {(r.notes ?? []).map((n) => (
            <p key={n} className="mt-4 flex gap-2.5 rounded-[16px] border border-warn/25 bg-warn-soft px-4 py-3 text-[12.5px] text-[#7A4A00]">
              <TriangleAlert size={16} className="mt-0.5 shrink-0 text-warn" /> {n}
            </p>
          ))}

          <div className="mt-5 grid gap-5 xl:grid-cols-[640px_minmax(0,1fr)]">
            <div className="flex flex-col gap-5">
              {rows.length > 0 && (
                <Card className="p-[22px]">
                  <CardHead
                    title="Sidik jari DNA"
                    sub={`${rows.length} titik SNP · merah = beda dari sampel`}
                    right={
                      <div className="flex gap-3">
                        {(
                          [
                            [0, 'AA'],
                            [1, 'AB'],
                            [2, 'BB'],
                            ['diff', 'beda'],
                          ] as const
                        ).map(([c, l]) => (
                          <span key={l} className="flex items-center gap-1.5 text-[11px] font-bold text-body">
                            <span className="h-3 w-2 rounded-[2px]" style={{ background: GENOTYPE[c] }} />
                            {l}
                          </span>
                        ))}
                      </div>
                    }
                  />
                  <div className="mt-4 space-y-3.5">
                    {[
                      { role: 'Sampel', name: x.sample_id, cells: cells.sample, tone: '' },
                      { role: 'Klaim', name: x.claim, cells: cells.claimed, tone: differs ? 'text-bad' : 'text-mint-deep' },
                      ...(differs ? [{ role: 'Registri', name: x.found_as!, cells: cells.found, tone: 'text-mint-deep' }] : []),
                    ].map((row) => (
                      <div key={row.role} className="flex items-center gap-3">
                        <span className="w-24 shrink-0">
                          <span className="block text-[9.5px] font-extrabold tracking-[0.08em] text-mute uppercase">{row.role}</span>
                          <span className={cx('block truncate text-[13px] font-bold', row.tone)}>{row.name}</span>
                        </span>
                        <Fingerprint cells={row.cells} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
                    {r.mismatches != null && (
                      <span className={differs || v !== 'COCOK' ? 'text-bad' : 'text-mint-deep'}>
                        {x.claim}: {r.mismatches} beda dari {r.compared} dibandingkan
                      </span>
                    )}
                    {differs && best && (
                      <span className="text-mint-deep">
                        {x.found_as}: {best.mismatches} beda dari {best.compared}
                      </span>
                    )}
                    <span className="font-normal text-mute">abu = tidak terbaca</span>
                  </div>
                </Card>
              )}

              <Card className="flex-1 p-[22px]">
                <CardHead title="Bagaimana vonis diambil" />
                <ol className="mt-4 space-y-3.5">
                  {(r.steps ?? []).map((st, i) => (
                    <li key={st.title} className="flex gap-3">
                      <span
                        className={cx(
                          'grid size-7 shrink-0 place-items-center rounded-full',
                          st.ok === true ? 'bg-ok-soft text-ok' : st.ok === false ? 'bg-bad-soft text-bad' : 'bg-info-soft text-info',
                        )}
                      >
                        {st.ok === true ? <Check size={15} /> : st.ok === false ? <X size={15} /> : <Info size={15} />}
                      </span>
                      <span>
                        <span className="block text-[13.5px] font-bold">
                          {i + 1}. {st.title}
                        </span>
                        <span className="block text-[12.5px] leading-relaxed text-body">{st.detail}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>

            <div className="flex flex-col gap-5">
              {differs && (
                <section
                  className="rounded-[22px] border border-line p-[22px]"
                  style={{ background: 'radial-gradient(120% 100% at 100% 0%, #FF8A3D24, transparent 70%), #fff' }}
                >
                  <CardHead title="Apa artinya bagi petani" sub={`Sifat ${x.claim} (dibayar) vs ${x.found_as} (diterima)`} />
                  {compare.isPending ? (
                    <p className="mt-3 text-[13px] text-mute">Memuat fakta uji lapang…</p>
                  ) : compare.isError ? (
                    <Problem what="Fakta uji lapang" error={compare.error} className="mt-3" />
                  ) : !impact && !traits.length ? (
                    <p className="mt-3 text-[13px] text-body">Belum ada uji lapang yang menanam kedua klon berdampingan, jadi dampaknya tidak ditulis.</p>
                  ) : (
                    <>
                      {impact && (
                        <div className="mt-3 flex items-end gap-3.5">
                          <span className={cx('font-display text-[64px] leading-[0.95] font-bold tracking-[-0.04em]', impact.pct < 0 ? 'text-bad' : 'text-ok')}>
                            {impact.pct > 0 ? '+' : impact.pct < 0 ? '−' : ''}
                            {Math.abs(impact.pct)}%
                          </span>
                          <span className="pb-1.5">
                            <span className="block text-[15px] font-bold">potensi hasil</span>
                            <span className="text-[12.5px] text-body">
                              {num(impact.paid)} → {num(impact.received)} kg/ha/tahun
                            </span>
                          </span>
                        </div>
                      )}
                      <ul className="mt-3">
                        {traits.map((t) => (
                          <li key={`${t.label}${t.site}`} className="flex items-center justify-between gap-3 border-t border-line py-2.5 text-[13px]">
                            <span className="min-w-0 text-body">
                              {t.label}
                              <span className="block truncate text-[11px] text-mute">
                                {t.site} {t.year} · {t.source}
                              </span>
                            </span>
                            <span className="flex items-center gap-2 text-right">
                              <b>
                                {num(t.paid)} → {num(t.received)}
                              </b>
                              {t.worse !== null && (
                                <span className={cx('rounded-full px-2 py-0.5 text-[10.5px] font-extrabold', t.worse ? 'bg-bad-soft text-bad' : 'bg-ok-soft text-ok')}>
                                  {t.worse ? 'lebih buruk' : 'lebih baik'}
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded-[10px] bg-cream px-2.5 py-1.5 text-[11px] font-semibold text-body">
                        <BookOpen size={13} /> Fakta uji lapang {impact ? `${impact.source} · ${impact.site}` : ''} · bukan prediksi
                      </p>
                    </>
                  )}
                </section>
              )}

              <Card className="flex-1 p-[22px]">
                <CardHead title="Data lapangan" />
                <dl className="mt-2">
                  {fieldRows.map(([FieldIcon, label, value]) => (
                    <div key={label} className="flex items-center gap-2.5 pt-2.5 text-[13px]">
                      <FieldIcon size={15} className="shrink-0 text-mute" />
                      <dt className="w-28 shrink-0 text-[12.5px] text-mute">{label}</dt>
                      <dd className="min-w-0 font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  )
}
