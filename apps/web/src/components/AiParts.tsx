import type { Ancestry, TraitPrediction } from '../lib/api'
import { pct } from '../lib/results'

// Motamayor genetic groups; "Lainnya" collects shares too small to read.
const GROUP_COLOR: Record<string, string> = {
  Criollo: '#7B4DFF', Iquitos: '#B9A2FF', Amelonado: '#FF8A3D', Nanay: '#3DDC97', 'Marañón': '#2BD37A',
  Contamana: '#FFC24B', Guiana: '#6E9BFF', Lainnya: '#D9C9B9',
}

export function AncestryBar({ a }: { a: Pick<Ancestry, 'composition'> }) {
  const big = Object.entries(a.composition).filter(([, v]) => v >= 0.02).sort((x, y) => y[1] - x[1])
  const rest = 1 - big.reduce((n, [, v]) => n + v, 0)
  const parts = rest > 0.005 ? [...big, ['Lainnya', rest] as [string, number]] : big
  return (
    <div className="space-y-2">
      <div className="flex h-3.5 gap-0.5 overflow-hidden rounded">
        {parts.map(([g, v]) => (
          <span key={g} title={`${g} ${pct(v, 0)}`} style={{ flex: `${v} 1 0`, background: GROUP_COLOR[g] ?? '#B9A99C' }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {parts.map(([g, v]) => (
          <span key={g} className="flex items-center gap-1.5 text-[11px] font-semibold text-body">
            <span className="size-2 rounded-[2px]" style={{ background: GROUP_COLOR[g] ?? '#B9A99C' }} />
            {g} {pct(v, 0)}
          </span>
        ))}
      </div>
    </div>
  )
}

const fmt = (v: number) => v.toLocaleString('id-ID', { maximumFractionDigits: 2 })

// Yield components with the model's honest ±80% interval (apps/api/tasks/VALIDASI_MODEL.md §2).
export function TraitList({ traits }: { traits: TraitPrediction }) {
  return (
    <dl className="divide-y divide-line">
      {Object.entries(traits).map(([k, t]) => (
        <div key={k} className="flex items-baseline justify-between gap-3 py-1.5 text-[12.5px]">
          <dt className="text-body">{t.label}</dt>
          <dd className="text-right font-bold whitespace-nowrap">
            {fmt(t.value)} <span className="font-semibold text-mute">± {fmt(t.pm80)} {t.unit}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
