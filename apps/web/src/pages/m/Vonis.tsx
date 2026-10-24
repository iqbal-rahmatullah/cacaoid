import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CircleX, Flag, RotateCcw } from 'lucide-react'
import { sim065 as s } from '../../data/demo'
import { Dark } from '../../components/ui'

const TODO = ['Tandai pohon: jangan ambil entres', `Ganti dengan entres ${s.claim} yang terverifikasi`, 'Ragu? minta uji ulang dulu sebelum menebang']

export default function Vonis() {
  const { id } = useParams()
  if (id !== s.id) return <p className="pt-10 text-center text-sm text-body">Contoh statis baru tersedia untuk {s.id}.</p>
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/m" aria-label="Kembali" className="grid size-10 place-items-center rounded-full border border-line bg-white">
          <ArrowLeft size={18} />
        </Link>
        <span>
          <span className="block font-mono text-lg font-bold">{s.id}</span>
          <span className="text-xs text-mute">Pohon induk · KE Luwu Utara · Blok B-4-17</span>
        </span>
      </div>

      <Dark glows={[['#FF5A5F', '0% 0%', '180% 120%']]} className="space-y-3.5 rounded-[28px] p-[22px]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF5A5F]/40 bg-[#FF5A5F]/15 px-3 py-1.5 text-[11.5px] font-extrabold tracking-[0.08em] text-[#FF8F92]">
          <CircleX size={14} /> OFF-TYPE
        </span>
        <p className="font-display text-[24px] leading-[1.1] font-bold tracking-[-0.025em]">
          Labelnya {s.claim},
          <br />
          tapi DNA-nya {s.found}.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-[14px] bg-white/5 px-3 py-2.5">
            <span className="block text-[9.5px] font-extrabold tracking-[0.1em] text-[#FF8F92]">DIKLAIM</span>
            <span className="text-[17px] font-extrabold">{s.claim}</span>
          </div>
          <ArrowRight size={18} className="text-white/50" />
          <div className="flex-1 rounded-[14px] bg-mint/10 px-3 py-2.5">
            <span className="block text-[9.5px] font-extrabold tracking-[0.1em] text-mint">DITEMUKAN</span>
            <span className="text-[17px] font-extrabold">{s.found}</span>
          </div>
        </div>
        <p className="text-xs text-white/60">
          {s.diff} dari {s.compared} titik DNA beda dari {s.claim} · error lab wajar ≤ {s.allowed}
        </p>
      </Dark>

      <div className="flex items-center gap-3.5 rounded-[20px] border border-line bg-white p-4">
        <span className="shrink-0 font-display text-4xl font-bold tracking-[-0.04em] text-bad">{s.impact.pct}</span>
        <span>
          <span className="block text-[13px] font-bold">potensi hasil bila entres dipakai</span>
          <span className="text-[11px] text-mute">Uji lapang Susilo dkk. 2015</span>
        </span>
      </div>

      <section className="space-y-2.5">
        <h2 className="font-display text-[17px] font-bold">Yang perlu dilakukan</h2>
        {TODO.map((t, i) => (
          <p key={t} className="flex items-center gap-2.5 text-[13px]">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-choc text-[11.5px] font-extrabold text-mint">{i + 1}</span>
            {t}
          </p>
        ))}
      </section>

      <div className="flex gap-2.5 pt-1">
        <button type="button" className="flex items-center gap-1.5 rounded-full border border-line bg-white px-5 py-3.5 text-[13.5px] font-bold">
          <RotateCcw size={16} /> Uji ulang
        </button>
        <button type="button" className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-bad py-3.5 text-[13.5px] font-extrabold text-white">
          <Flag size={16} /> Tandai pohon
        </button>
      </div>
    </div>
  )
}
