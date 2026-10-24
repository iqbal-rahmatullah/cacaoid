import { useState } from 'react'
import { X } from 'lucide-react'
import { searchClones } from '../lib/field'

const input = 'w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] font-semibold outline-none focus:border-mint-deep'

// Pick several registry clones (garden clones on Penyedia, a planned block on Analitik AI).
export function ClonesInput({ value, onChange, names }: { value: string[]; onChange: (v: string[]) => void; names: string[] }) {
  const [q, setQ] = useState('')
  const options = q.trim() ? searchClones(names, q, [], 6).filter((n) => !value.includes(n)) : []
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((c) => (
          <span key={c} className="flex items-center gap-1 rounded-lg bg-cream py-1 pr-1 pl-2 text-[11.5px] font-bold">
            {c}
            <button type="button" aria-label={`Hapus ${c}`} onClick={() => onChange(value.filter((x) => x !== c))} className="grid size-4 place-items-center rounded text-mute hover:bg-line">
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari klon di registri…" className={input} />
        {options.length > 0 && (
          <ul className="absolute inset-x-0 z-10 mt-1 rounded-xl border border-line bg-white p-1 shadow-lg">
            {options.map((n) => (
              <li key={n}>
                <button
                  type="button"
                  onClick={() => {
                    onChange([...value, n])
                    setQ('')
                  }}
                  className="w-full rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold hover:bg-cream"
                >
                  {n}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
