import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, ChevronDown, MapPinned, Save } from 'lucide-react'
import { SimBadge, cx } from '../../components/ui'

const KINDS = ['Pohon induk', 'Bibit sambung', 'Bibit hibrida']
// Same checklist as cacaoid-app/frontend/src/pages/Lapangan.tsx ("pohon induk entres").
const PROCEDURE = [
  'Daun muda dari cabang batang atas, bukan tunas dari pangkal',
  'Label kantong = ID sampel',
  'Gunting dibersihkan alkohol antar pohon',
  'Daun langsung masuk silika gel',
]
const BARCODE = [2, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 2, 3, 1, 1, 2]

function Field({ label, value, icon: Icon }: { label: string; value: string; icon: typeof ChevronDown }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-body">{label}</span>
      <span className="flex items-center gap-2.5 rounded-[14px] border border-line bg-white px-3.5 py-3">
        <span className="flex-1 text-sm font-semibold">{value}</span>
        <Icon size={17} className="text-mute" />
      </span>
    </label>
  )
}

export default function Ambil() {
  const [kind, setKind] = useState(KINDS[0])
  const [checked, setChecked] = useState(PROCEDURE.map(() => true))
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/m" aria-label="Kembali" className="grid size-10 place-items-center rounded-full border border-line bg-white">
          <ArrowLeft size={18} />
        </Link>
        <span className="flex-1">
          <span className="block font-display text-xl font-bold tracking-tight">Ambil sampel</span>
          <span className="text-xs text-mute">KE Luwu Utara · 13 dari 38</span>
        </span>
        <SimBadge />
      </div>

      <div className="space-y-3 rounded-[26px] bg-choc p-4">
        <div className="relative grid h-[150px] place-items-center overflow-hidden rounded-[18px] bg-gradient-to-b from-[#3A2A20] to-[#20140E]">
          {['top-4 left-4 border-t-[3px] border-l-[3px] rounded-tl-lg', 'top-4 right-4 border-t-[3px] border-r-[3px] rounded-tr-lg', 'bottom-4 right-4 border-b-[3px] border-r-[3px] rounded-br-lg', 'bottom-4 left-4 border-b-[3px] border-l-[3px] rounded-bl-lg'].map((c) => (
            <span key={c} className={cx('absolute size-[26px] border-mint', c)} />
          ))}
          <div className="flex h-[66px] w-40 flex-col items-center justify-center gap-1 rounded-[10px] bg-cream">
            <span className="flex h-6 items-center gap-0.5">
              {BARCODE.map((w, i) => (
                <span key={i} className={i % 2 ? '' : 'bg-choc'} style={{ width: w, height: 24 }} />
              ))}
            </span>
            <span className="font-mono text-[13px] font-bold">SIM-065</span>
          </div>
          <span className="scan-line absolute inset-x-8 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-mint to-transparent" />
        </div>
        <div className="flex items-center gap-2.5 text-white">
          <span className="grid size-[30px] place-items-center rounded-full bg-mint text-choc">
            <Check size={16} />
          </span>
          <span>
            <span className="block text-[13.5px] font-bold">Kantong SIM-065 terbaca</span>
            <span className="text-[11.5px] text-white/55">GPS −2,5572 · 120,3293 · ±6 m</span>
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-xs font-bold text-body">Jenis sampel</span>
        <div className="flex gap-1 rounded-[14px] bg-taupe-soft p-1">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cx('flex-1 rounded-[11px] py-2.5 text-[12.5px] transition', k === kind ? 'bg-white font-extrabold shadow-sm' : 'font-semibold text-body')}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <Field label="Klon yang diklaim (sesuai label)" value="MCC 01" icon={ChevronDown} />
      <Field label="Posisi pohon di kebun" value="Blok B · baris 4 · pohon 17" icon={MapPinned} />

      <div className="space-y-2.5 rounded-2xl border border-line bg-white p-3.5">
        {PROCEDURE.map((p, i) => (
          <button
            key={p}
            type="button"
            onClick={() => setChecked((c) => c.map((x, j) => (j === i ? !x : x)))}
            className="flex w-full items-center gap-2.5 text-left text-[12.5px]"
          >
            <span className={cx('grid size-[22px] shrink-0 place-items-center rounded-[7px] transition', checked[i] ? 'bg-mint-deep text-white' : 'border-2 border-line')}>
              {checked[i] && <Check size={14} />}
            </span>
            {p}
          </button>
        ))}
      </div>

      <div className="space-y-2 pt-1 text-center">
        <Link
          to="/m"
          className={cx(
            'flex items-center justify-center gap-2 rounded-full py-4 text-[15px] font-extrabold transition',
            checked.every(Boolean) ? 'bg-choc text-white' : 'pointer-events-none bg-line text-mute',
          )}
        >
          <Save size={18} className="text-mint" /> Simpan ke antrean
        </Link>
        <p className="text-[11.5px] text-mute">Tersimpan di ponsel · terkirim otomatis saat ada sinyal</p>
      </div>
    </div>
  )
}
