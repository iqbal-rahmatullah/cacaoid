import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CircleAlert, CircleCheck, CircleX, LoaderCircle, ShieldCheck, Sprout } from 'lucide-react'
import { ApiError, get, type PublicSeal, type Verdict } from '../lib/api'
import { longDate } from '../lib/results'
import { SimBadge, VerdictPill, cx } from '../components/ui'

// Public, read-only page behind the QR on a printed berita acara or seedling passport. It shows only the summary in
// the seal (no officer names, no lab data, location to ~1 km) and whether the data still matches the printout.
export default function Cek() {
  const { code } = useParams()
  const seal = useQuery({ queryKey: ['public-seal', code], queryFn: () => get<PublicSeal>(`/public/seals/${code}`), retry: false })
  const s = seal.data
  const d = s?.data
  const status = !s
    ? null
    : !s.chain_ok
      ? { tone: 'bad', icon: CircleX, title: 'Jejak audit rusak', text: 'Catatan di server tidak lagi utuh. Jangan pakai dokumen ini sebelum dicek ke UPTD.' }
      : s.unchanged
        ? { tone: 'ok', icon: CircleCheck, title: 'Dokumen asli', text: 'Diterbitkan CacaoID, dan datanya masih sama dengan saat dicetak.' }
        : { tone: 'warn', icon: CircleAlert, title: 'Data berubah sejak dicetak', text: 'Dokumen ini asli, tetapi hasilnya sudah diperbarui. Minta salinan terbaru.' }

  return (
    <main className="min-h-screen bg-cream px-4 py-8">
      <div className="mx-auto max-w-md space-y-4">
        <header className="flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-[11px] bg-choc text-mint">
              <Sprout size={18} />
            </span>
            <span>
              <span className="block font-display text-lg leading-none font-bold">CacaoID</span>
              <span className="text-[11.5px] text-mute">Cek keaslian dokumen</span>
            </span>
          </span>
          <SimBadge />
        </header>

        {seal.isPending ? (
          <p className="flex items-center gap-2 rounded-[22px] bg-white p-5 text-sm text-mute">
            <LoaderCircle size={16} className="animate-spin" /> Memeriksa kode {code}…
          </p>
        ) : seal.isError ? (
          <section className="space-y-1.5 rounded-[22px] border border-bad/30 bg-bad-soft p-5 text-bad">
            <p className="flex items-center gap-2 font-display text-xl font-bold">
              <CircleX size={22} /> {seal.error instanceof ApiError && seal.error.status === 404 ? 'Kode tidak dikenal' : 'Belum bisa diperiksa'}
            </p>
            <p className="text-[13px]">{seal.error instanceof TypeError ? 'Server tidak bisa dihubungi. Coba lagi saat ada sinyal.' : seal.error.message}</p>
          </section>
        ) : (
          s &&
          d &&
          status && (
            <>
              <section
                className={cx(
                  'space-y-1.5 rounded-[22px] border p-5',
                  status.tone === 'ok' ? 'border-ok/30 bg-ok-soft text-ok' : status.tone === 'warn' ? 'border-warn/30 bg-warn-soft text-[#7A4A00]' : 'border-bad/30 bg-bad-soft text-bad',
                )}
              >
                <p className="flex items-center gap-2 font-display text-xl font-bold">
                  <status.icon size={22} /> {status.title}
                </p>
                <p className="text-[13px]">{status.text}</p>
              </section>

              <section className="space-y-3 rounded-[22px] border border-line bg-white p-5">
                <p className="text-[10.5px] font-extrabold tracking-[0.1em] text-mute uppercase">
                  {s.kind === 'paspor' ? 'Paspor bibit' : 'Berita acara verifikasi'} · kode <span className="font-mono normal-case">{s.code}</span>
                </p>
                {s.kind === 'paspor' ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <span>
                        <span className="block font-mono text-xl font-bold">{d.sample_id}</span>
                        <span className="text-[12.5px] text-body">{d.kind}</span>
                      </span>
                      {d.verdict && <VerdictPill v={d.verdict} />}
                    </div>
                    <Rows
                      rows={[
                        ['Klon pada label', d.claim],
                        ['Identitas DNA', d.verified ? 'terverifikasi sesuai label' : 'tidak sesuai label'],
                        ['Kebun', [d.provider, d.regency, d.province].filter(Boolean).join(', ')],
                        ['Area tanam', d.area ? `sekitar ${d.area.map((c) => c.toFixed(2).replace('.', ',').replace('-', '−')).join(' · ')} (±1 km)` : 'tanpa GPS'],
                        ['Skrining EUDR', d.eudr ? `${d.eudr} (alat skrining, bukan putusan)` : '—'],
                      ]}
                    />
                  </>
                ) : (
                  <>
                    <p className="font-display text-xl font-bold">{d.batch}</p>
                    <Rows rows={[['Sampel', String(d.samples ?? '—')], ['Kontrol plate', d.controls_ok == null ? '—' : d.controls_ok ? 'lolos' : 'bermasalah']]} />
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(d.counts ?? {}).map(([v, n]) => (
                        <span key={v} className="flex items-center gap-1">
                          <VerdictPill v={v as Verdict} /> <b className="text-[12px]">{n}</b>
                        </span>
                      ))}
                    </div>
                    {d.lots?.map((l) => (
                      <p key={l.lot} className="text-[12.5px] text-body">
                        Lot <b className="font-mono">{l.lot}</b> ({l.claim}): <b>{l.decision}</b>
                      </p>
                    ))}
                  </>
                )}
                <Rows rows={[['Batch', d.batch], ['Dianalisis', longDate(d.analyzed)], ['Dicetak', longDate(s.issued_at)]]} />
              </section>

              <p className="flex items-start gap-2 px-1 text-[11.5px] leading-relaxed text-mute">
                <ShieldCheck size={14} className="mt-px shrink-0" /> Halaman publik ini hanya menampilkan ringkasan. Nama petugas, data lab, dan titik GPS persis
                tidak ditampilkan.
              </p>
            </>
          )
        )}
      </div>
    </main>
  )
}

function Rows({ rows }: { rows: [string, string | undefined][] }) {
  return (
    <dl className="divide-y divide-line">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 py-2 text-[13px]">
          <dt className="text-mute">{k}</dt>
          <dd className="text-right font-semibold">{v || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}
