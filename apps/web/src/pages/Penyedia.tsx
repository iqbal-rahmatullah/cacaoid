import { CalendarCheck, Hourglass, Leaf, Plus } from 'lucide-react'
import { providers } from '../data/demo'
import { Card, Dark, Overline, TopBar, cx } from '../components/ui'

const total = providers.reduce((n, p) => n + p.recommend, 0)

export default function Penyedia() {
  return (
    <>
      <TopBar
        crumb={['Data', 'Penyedia & kebun']}
        title="Penyedia & kebun entres"
        sub="4 kebun entres terdaftar · jumlah daun yang diambil mengikuti riwayat tiap kebun"
        secondary={{ icon: Plus, label: 'Daftarkan penyedia' }}
        primary={{ icon: CalendarCheck, label: 'Kirim rencana sampling', to: '/m' }}
      />

      <Dark glows={[['#3DDC97', '20% 0%', '100% 160%']]} className="mt-6 grid items-center gap-9 p-7 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.1em] text-mint">RENCANA SAMPLING · NOV 2026</p>
          <div className="mt-2 flex items-end gap-3">
            <span className="font-display text-[76px] leading-[0.9] font-bold tracking-[-0.04em]">{total}</span>
            <span className="pb-1.5 text-[15px] leading-tight font-semibold text-white/70">
              daun dari
              <br />4 kebun
            </span>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-white/55">
            Kebun dengan riwayat buruk diambil lebih banyak. Skor = aturan terbuka + penghalusan Bayes, bukan AI.
          </p>
        </div>
        <div className="space-y-3">
          {providers.map((p) => (
            <div key={p.name} className="flex items-center gap-3.5">
              <span className="w-24 shrink-0 text-[13px] font-bold">{p.name.replace('KE Simulasi ', '')}</span>
              <div className="h-[22px] flex-1 overflow-hidden rounded-[7px] bg-white/[0.07]">
                <div
                  className="h-full rounded-[7px]"
                  style={{
                    width: `${(p.recommend / 60) * 100}%`,
                    background: p.tier === 'Tinggi' ? 'linear-gradient(90deg, #FF8A3D, #FF5A5F)' : 'linear-gradient(90deg, #3DDC97, #2BD37A)',
                  }}
                />
              </div>
              <span className="w-16 text-right text-[13px] font-extrabold">{p.recommend} daun</span>
            </div>
          ))}
        </div>
      </Dark>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {providers.map((p) => {
          const high = p.tier === 'Tinggi'
          return (
            <Card key={p.name} className="flex gap-5 p-[22px]">
              <div
                className="relative grid size-28 shrink-0 place-items-center rounded-full"
                style={{ background: `conic-gradient(${high ? '#E5484D' : '#FF8A3D'} ${p.score * 3.6}deg, #F6F0E8 0)` }}
              >
                <div className="grid size-[90px] place-items-center rounded-full bg-white text-center">
                  <span>
                    <span className="block font-display text-[32px] leading-none font-bold tracking-tight">{p.score}</span>
                    <span className="text-[10.5px] text-mute">dari 100</span>
                  </span>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <div className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block font-display text-[17px] font-bold">{p.name}</span>
                    <span className="text-xs text-mute">
                      {p.region} · off-type {p.history}
                    </span>
                  </span>
                  <span className={cx('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold', high ? 'bg-bad-soft text-bad' : 'bg-pod-soft text-[#C2560F]')}>
                    Risiko {p.tier.toLowerCase()}
                  </span>
                </div>
                {p.factors.map(([f, pts]) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-body">
                    <span className="rounded-[7px] bg-cream px-1.5 py-0.5 text-[11px] font-extrabold">+{pts}</span>
                    {f}
                  </div>
                ))}
                <div className="pt-1">
                  <Overline className="text-[10px]">Klon terdaftar</Overline>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {p.clones.map((c) => (
                      <span key={c} className="rounded-lg bg-cream px-2 py-1 text-[11px] font-bold text-body">
                        {c}
                      </span>
                    ))}
                    <span className="rounded-lg border border-line px-2 py-1 text-[11px] font-bold text-mute">+{p.more}</span>
                  </div>
                  {p.warn && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-info">
                      <Hourglass size={12} /> {p.warn}
                    </p>
                  )}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-line pt-2.5">
                  <span className="text-xs text-mute">{p.clones.length + p.more} klon terdaftar</span>
                  <span className="flex items-center gap-1.5 text-[13px] font-extrabold text-mint-deep">
                    <Leaf size={14} /> Ambil {p.recommend} daun
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </>
  )
}
