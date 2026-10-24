import { Link, useParams } from 'react-router-dom'
import { ArrowRight, BookOpen, Calendar, Check, CircleX, ClipboardCheck, Dna, LocateFixed, MapPin, Package, RotateCcw, Tag, X } from 'lucide-react'
import { fingerprint, sim065 as s } from '../data/demo'
import { Card, CardHead, Dark, Fingerprint, GENOTYPE, TopBar, cx } from '../components/ui'

const FIELD_ICONS = [MapPin, LocateFixed, Calendar, Package]

export default function Sampel() {
  const { id } = useParams()
  if (id !== s.id)
    return (
      <Card className="mx-auto mt-16 max-w-md text-center">
        <p className="font-display text-xl font-bold">Detail {id} belum dibuat</p>
        <p className="mt-2 text-sm text-body">Mockup statis ini baru memuat satu contoh lengkap: {s.id}.</p>
        <Link to={`/hasil/${s.id}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-mint-deep hover:underline">
          Buka {s.id} <ArrowRight size={15} />
        </Link>
      </Card>
    )

  return (
    <>
      <TopBar
        crumb={['Hasil verifikasi', s.id]}
        title={`${s.id} · ${s.kind}`}
        sub={`${s.garden} · diambil 6 Okt 2026 oleh Pengawas 3 · Batch demo Sulawesi`}
        secondary={{ icon: RotateCcw, label: 'Minta uji ulang' }}
        primary={{ icon: ClipboardCheck, label: 'Catat tindak lanjut' }}
      />

      <Dark glows={[['#FF5A5F', '0% 0%', '110% 160%'], ['#3DDC97', '100% 100%', '80% 140%']]} className="mt-6 grid items-center gap-8 p-[30px] xl:grid-cols-[minmax(0,1fr)_440px]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#FF5A5F]/40 bg-[#FF5A5F]/15 px-3.5 py-1.5 text-xs font-extrabold tracking-[0.08em] text-[#FF8F92]">
            <CircleX size={16} /> OFF-TYPE · BUKAN KLON YANG DIKLAIM
          </span>
          <h2 className="mt-3.5 font-display text-[40px] leading-[1.05] font-bold tracking-[-0.03em]">
            Labelnya {s.claim},
            <br />
            tapi DNA-nya {s.found}.
          </h2>
          <p className="mt-3.5 max-w-2xl text-sm leading-relaxed text-white/70">
            {s.diff} dari {s.compared} titik DNA berbeda dari {s.claim}, padahal error lab wajar paling banyak {s.allowed}. Sidik jarinya sama persis dengan {s.found} di registri.
          </p>
        </div>
        <div className="space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-[18px] border border-[#FF5A5F]/35 bg-white/[0.04] p-[18px]">
              <span className="flex items-center gap-1.5 text-[10.5px] font-extrabold tracking-[0.1em] text-[#FF8F92]">
                <Tag size={13} /> DIKLAIM
              </span>
              <p className="mt-1.5 font-display text-[28px] leading-none font-bold">{s.claim}</p>
              <p className="mt-1.5 text-xs text-white/55">
                {s.diff} beda dari {s.compared}
              </p>
            </div>
            <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-white/10">
              <ArrowRight size={17} />
            </span>
            <div className="flex-1 rounded-[18px] border border-mint/40 bg-mint/10 p-[18px]">
              <span className="flex items-center gap-1.5 text-[10.5px] font-extrabold tracking-[0.1em] text-mint">
                <Dna size={13} /> DITEMUKAN
              </span>
              <p className="mt-1.5 font-display text-[28px] leading-none font-bold">{s.found}</p>
              <p className="mt-1.5 text-xs text-white/55">0 beda dari {s.compared}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              [s.callRate, `DNA terbaca (${s.read})`],
              [`≤ ${s.allowed}`, 'beda yang wajar'],
              ['2', 'sumber genom setuju'],
            ].map(([v, l]) => (
              <div key={l} className="rounded-[14px] bg-white/5 px-3.5 py-2.5">
                <p className="font-display text-xl font-bold">{v}</p>
                <p className="text-[11px] text-white/50">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </Dark>

      <div className="mt-5 grid gap-5 xl:grid-cols-[640px_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <Card className="p-[22px]">
            <CardHead
              title="Sidik jari DNA"
              sub="48 titik SNP · merah = beda dari sampel"
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
                { role: 'Sampel', name: s.id, cells: fingerprint.sample, tone: '' },
                { role: 'Klaim', name: s.claim, cells: fingerprint.claim, tone: 'text-bad' },
                { role: 'Registri', name: s.found, cells: fingerprint.found, tone: 'text-mint-deep' },
              ].map((r) => (
                <div key={r.role} className="flex items-center gap-3">
                  <span className="w-24 shrink-0">
                    <span className="block text-[9.5px] font-extrabold tracking-[0.08em] text-mute uppercase">{r.role}</span>
                    <span className={cx('text-[13px] font-bold', r.tone)}>{r.name}</span>
                  </span>
                  <Fingerprint cells={r.cells} />
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
              <span className="text-bad">
                {s.claim}: {s.diff} beda dari {s.compared} dibandingkan
              </span>
              <span className="text-mint-deep">
                {s.found}: 0 beda dari {s.compared}
              </span>
              <span className="font-normal text-mute">abu = tidak terbaca</span>
            </div>
          </Card>

          <Card className="flex-1 p-[22px]">
            <CardHead title="Bagaimana vonis diambil" />
            <ol className="mt-4 space-y-3.5">
              {s.steps.map((st, i) => (
                <li key={st.title} className="flex gap-3">
                  <span className={cx('grid size-7 shrink-0 place-items-center rounded-full', st.ok ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-bad')}>
                    {st.ok ? <Check size={15} /> : <X size={15} />}
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
          <section
            className="rounded-[22px] border border-line p-[22px]"
            style={{ background: 'radial-gradient(120% 100% at 100% 0%, #FF8A3D24, transparent 70%), #fff' }}
          >
              <CardHead title="Apa artinya bagi petani" sub="Sifat klon yang dibayar vs yang diterima" />
              <div className="mt-3 flex items-end gap-3.5">
                <span className="font-display text-[64px] leading-[0.95] font-bold tracking-[-0.04em] text-bad">{s.impact.pct}</span>
                <span className="pb-1.5">
                  <span className="block text-[15px] font-bold">potensi hasil</span>
                  <span className="text-[12.5px] text-body">{s.impact.yield}</span>
                </span>
              </div>
              <ul className="mt-3">
                {s.traits.map((t) => (
                  <li key={t.label} className="flex items-center justify-between border-t border-line py-2.5 text-[13px]">
                    <span className="text-body">{t.label}</span>
                    <span className="flex items-center gap-2">
                      <b>{t.value}</b>
                      <span className={cx('rounded-full px-2 py-0.5 text-[10.5px] font-extrabold', t.better ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-bad')}>
                        {t.better ? 'lebih baik' : 'lebih buruk'}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-[10px] bg-cream px-2.5 py-1.5 text-[11px] font-semibold text-body">
                <BookOpen size={13} /> Fakta uji lapang Susilo dkk. 2015 · Luwu Utara 2013–14 · bukan prediksi
              </p>
          </section>

          <Card className="flex-1 p-[22px]">
            <CardHead title="Data lapangan" />
            <dl className="mt-2">
              {s.field.map((f, i) => {
                const Icon = FIELD_ICONS[i]
                return (
                  <div key={f.label} className="flex items-center gap-2.5 pt-2.5 text-[13px]">
                    <Icon size={15} className="text-mute" />
                    <dt className="w-24 text-[12.5px] text-mute">{f.label}</dt>
                    <dd className="font-semibold">{f.value}</dd>
                  </div>
                )
              })}
            </dl>
          </Card>
        </div>
      </div>
    </>
  )
}
