import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, FileDown, Hand, Map as MapIcon, Send, ShieldCheck } from 'lucide-react'
import { batch, labQc, lot, retest, samples, verdictCounts } from '../data/demo'
import type { Verdict } from '../data/demo'
import { Card, Dark, TONE, TopBar, VERDICT, VerdictPill, cx } from '../components/ui'

const COLS = ['ID sampel', 'Klaim', 'Vonis', 'Terbaca sebagai', 'Kebun entres', 'Tanggal']
const SCALE = 0.3 // lot meter runs 0–30%
const at = (v: number) => `${(v / SCALE) * 100}%`

export default function Hasil() {
  const [filter, setFilter] = useState<Verdict | null>(null)
  const rows = filter ? samples.filter((s) => s.v === filter) : samples

  return (
    <>
      <TopBar
        crumb={['Hasil verifikasi', batch.name]}
        title={batch.name}
        sub={`${batch.samples} sampel · dianalisis ${batch.analyzed} · ${batch.labFile} · kontrol plate lolos`}
        secondary={{ icon: MapIcon, label: 'GeoJSON EUDR' }}
        primary={{ icon: FileDown, label: 'Unduh berita acara', to: '/laporan' }}
      />

      <div className="mt-5 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFilter(null)}
          className={cx('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold', filter ? 'border border-line bg-white text-body' : 'bg-choc text-white')}
        >
          Semua <span className={filter ? 'text-ink' : 'text-mint'}>{batch.samples}</span>
        </button>
        {verdictCounts.map(([v, n]) => (
          <button
            key={v}
            type="button"
            onClick={() => setFilter(v === filter ? null : v)}
            className={cx(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10.5px] font-bold transition',
              v === filter ? cx('border-transparent', VERDICT[v].soft) : 'border-line bg-white text-body hover:border-mute/40',
            )}
          >
            <span className="size-[7px] rounded-full" style={{ background: VERDICT[v].hex }} />
            {v} <span className={VERDICT[v].text}>{n}</span>
          </button>
        ))}
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
                {rows.map((s) => {
                  const detail = s.id === 'SIM-065'
                  return (
                    <tr
                      key={s.id}
                      className={cx(
                        'border-b border-line text-[13px] last:border-0',
                        detail ? 'bg-bad/[0.05] outline outline-bad/25 -outline-offset-1' : 'hover:bg-cream/50',
                      )}
                    >
                      <td className="py-2.5 pr-3.5 pl-4">
                        <span className="block font-mono text-[12.5px] font-bold">{s.id}</span>
                        <span className="text-[11px] text-mute">{s.kind}</span>
                      </td>
                      <td className="px-3.5 font-semibold">{s.claim}</td>
                      <td className="px-3.5">
                        <VerdictPill v={s.v} />
                      </td>
                      <td
                        className={cx(
                          'px-3.5',
                          s.v === 'OFF-TYPE' ? 'font-bold text-bad' : s.v === 'TIDAK DIKENAL' ? 'font-semibold text-bean' : 'text-body',
                        )}
                      >
                        {s.found}
                      </td>
                      <td className="px-3.5 text-[12.5px] text-body">{s.garden}</td>
                      <td className="px-3.5 text-[12.5px] text-mute">{s.date}</td>
                      <td className="pr-3">
                        {detail && (
                          <Link to={`/hasil/${s.id}`} aria-label={`Buka ${s.id}`} className="grid size-7 place-items-center rounded-full hover:bg-white">
                            <ChevronRight size={16} className="text-bad" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-auto flex items-center justify-between px-3.5 pt-3">
            <span className="text-[12.5px] text-mute">
              Menampilkan {rows.length} dari {batch.samples} sampel
            </span>
            <div className="flex gap-1.5">
              {['1', '2', '3', '…', '13'].map((p) => (
                <span key={p} className={cx('grid size-[30px] place-items-center rounded-[9px] text-xs font-bold', p === '1' ? 'bg-choc text-white' : 'bg-cream text-body')}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-5">
          <Dark glows={[['#FF7A2F', '100% 0%', '140% 100%']]} className="p-[22px]">
            <div className="flex items-start justify-between">
              <span>
                <span className="block text-[10.5px] font-extrabold tracking-[0.1em] text-white/50">LOT HIBRIDA</span>
                <span className="font-mono text-[17px] font-bold">{lot.id}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF7A2F] px-3 py-1.5 text-[11.5px] font-extrabold tracking-wide text-choc">
                <Hand size={14} /> TAHAN
              </span>
            </div>
            <div className="mt-3 flex items-end gap-2.5">
              <span className="font-display text-[52px] leading-[0.95] font-bold tracking-tight text-[#FF9A5C]">{lot.estimateLabel}</span>
              <span className="pb-1 text-[13px] leading-tight font-semibold text-white/70">
                bibit
                <br />
                kontaminan
              </span>
            </div>
            <div className="relative mt-5 h-[22px]">
              <span className="absolute inset-x-0 top-2 h-1.5 rounded-full bg-white/10" />
              <span
                className="absolute top-1.5 h-2.5 rounded-full bg-[#FF7A2F]/40"
                style={{ left: at(lot.ci[0]), width: `calc(${at(lot.ci[1])} - ${at(lot.ci[0])})` }}
              />
              <span className="absolute top-0 h-[22px] w-0.5 bg-mint" style={{ left: at(lot.limit) }} />
              <span className="absolute top-1 size-3.5 -translate-x-1/2 rounded-full border-[3px] border-choc bg-[#FF9A5C]" style={{ left: at(lot.estimate) }} />
            </div>
            <div className="relative mt-1.5 h-4 text-[10.5px] font-semibold text-white/40">
              <span className="absolute left-0">0%</span>
              <span className="absolute -translate-x-1/3 text-mint" style={{ left: at(lot.limit) }}>
                5% batas
              </span>
              <span className="absolute -translate-x-1/2" style={{ left: at(0.15) }}>
                15%
              </span>
              <span className="absolute right-0">30%</span>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-white/70">
              {lot.excluded} dari {lot.n} bibit bukan anak {lot.parents}. Perkiraan kontaminasi {lot.estimateLabel} (rentang {lot.ciLabel}), di atas batas 5%.
            </p>
          </Dark>

          <Card className="flex flex-1 flex-col gap-3 px-[22px] py-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Kualitas data lab</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2.5 py-0.5 text-[10.5px] font-extrabold text-ok">
                <ShieldCheck size={13} /> LOLOS
              </span>
            </div>
            {labQc.map((q) => {
              const t = TONE[q.tone]
              return (
                <div key={q.label} className="flex items-center gap-2.5 text-[12.5px]">
                  <t.icon size={16} className={t.text} />
                  <span className="flex-1 text-body">{q.label}</span>
                  <b>{q.value}</b>
                </div>
              )
            })}
            <div className="mt-auto rounded-2xl bg-cream p-3.5">
              <p className="text-[12.5px] font-bold">Perlu daun baru</p>
              <div className="mt-2.5 flex gap-1.5">
                {retest.map((r) => (
                  <span key={r.id} className="flex items-center gap-1.5 rounded-[9px] border border-line bg-white px-2 py-1">
                    <b className="font-mono text-[11.5px]">{r.id}</b>
                    <span className="text-[11px] text-mute">DNA {r.rate}</span>
                  </span>
                ))}
              </div>
              <Link to="/m" className="mt-3 flex items-center justify-center gap-2 rounded-full bg-choc py-2.5 text-[12.5px] font-bold text-white">
                <Send size={14} className="text-mint" /> Kirim tugas ke ponsel pengawas
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
