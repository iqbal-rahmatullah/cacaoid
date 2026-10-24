import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Flag, RotateCcw } from 'lucide-react'
import { get, post, type Compare, type SampleDetail } from '../../lib/api'
import { headline, nextSteps, yieldImpact } from '../../lib/field'
import { Dark, VERDICT, VERDICT_ICON, cx } from '../../components/ui'
import { FollowUp } from '../../components/FollowUp'

const ACTIONABLE = ['OFF-TYPE', 'BATANG BAWAH', 'TIDAK DIKENAL', 'KONTAMINAN']

export default function Vonis() {
  const { batchId, sampleId } = useParams()
  const qc = useQueryClient()
  const key = ['sample', batchId, sampleId]
  const sample = useQuery({ queryKey: key, queryFn: () => get<SampleDetail>(`/batches/${batchId}/samples/${sampleId}`) })
  const x = sample.data
  const compare = useQuery({
    queryKey: ['compare', x?.claim, x?.found_as],
    enabled: !!x?.found_as,
    queryFn: () => get<Compare>(`/traits/compare?paid=${encodeURIComponent(x!.claim)}&received=${encodeURIComponent(x!.found_as!)}`),
  })
  const act = useMutation({
    mutationFn: (action: 'uji ulang' | 'pemurnian') => post(`/batches/${batchId}/samples/${sampleId}/action`, { action }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key })
      qc.invalidateQueries({ queryKey: ['batch'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const back = (
    <Link to="/m/hasil" aria-label="Kembali" className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-white">
      <ArrowLeft size={18} />
    </Link>
  )
  if (sample.isPending) return <div className="flex items-center gap-3">{back}<span className="text-sm text-mute">Memuat hasil…</span></div>
  if (sample.isError)
    return (
      <div className="space-y-4">
        {back}
        <p role="alert" className="rounded-2xl bg-bad-soft px-3.5 py-3 text-[12.5px] text-bad">{sample.error.message}</p>
      </div>
    )

  const s = sample.data
  const v = s.verdict
  const r = s.result
  const impact = compare.data ? yieldImpact(compare.data) : null
  const steps = v ? nextSteps(v, s.claim) : []
  const unit = s.kind.startsWith('bibit') ? 'bibit' : 'pohon'
  const confirmed = s.action === 'uji ulang' && !!s.outcome?.startsWith('Dikonfirmasi')
  const canRetest = !s.action && !s.closed_at && (v === 'UJI ULANG' || ACTIONABLE.includes(v ?? ''))
  const canMark = (!s.action || confirmed) && !s.closed_at && ACTIONABLE.includes(v ?? '')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {back}
        <span className="min-w-0">
          <span className="block font-mono text-lg font-bold">{s.sample_id}</span>
          <span className="block truncate text-xs text-mute">
            {s.kind} · {s.provider.replace('KE Simulasi ', 'KE ')}
            {s.lot && ` · ${s.lot}`}
            {s.position && ` · ${s.position}`}
          </span>
        </span>
      </div>

      {!v ? (
        <p className="rounded-2xl border border-dashed border-line px-3.5 py-4 text-center text-[12.5px] text-body">
          Sampel sudah tercatat, hasil lab belum masuk.
        </p>
      ) : (
        <Dark glows={[[VERDICT[v].hex, '0% 0%', '180% 120%']]} className="space-y-3.5 rounded-[28px] p-[22px]">
          <Pill v={v} />
          <p className="font-display text-[24px] leading-[1.1] font-bold tracking-[-0.025em]">{headline(v, s.claim, s.found_as)}</p>
          {s.found_as && (
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-[14px] bg-white/5 px-3 py-2.5">
                <span className="block text-[9.5px] font-extrabold tracking-[0.1em] text-[#FF8F92]">DIKLAIM</span>
                <span className="text-[17px] font-extrabold">{s.claim}</span>
              </div>
              <ArrowRight size={18} className="shrink-0 text-white/50" />
              <div className="flex-1 rounded-[14px] bg-mint/10 px-3 py-2.5">
                <span className="block text-[9.5px] font-extrabold tracking-[0.1em] text-mint">DITEMUKAN</span>
                <span className="text-[17px] font-extrabold">{s.found_as}</span>
              </div>
            </div>
          )}
          {r.mismatches != null && r.compared != null && (
            <p className="text-xs text-white/60">
              {r.mismatches} dari {r.compared} titik DNA beda dari {s.claim} · error lab wajar ≤ {r.allowed}
            </p>
          )}
        </Dark>
      )}

      {impact && (
        <div className="flex items-center gap-3.5 rounded-[20px] border border-line bg-white p-4">
          <span className={cx('shrink-0 font-display text-4xl font-bold tracking-[-0.04em]', impact.pct < 0 ? 'text-bad' : 'text-ok')}>
            {impact.pct > 0 ? '+' : impact.pct < 0 ? '−' : ''}
            {Math.abs(impact.pct)}%
          </span>
          <span>
            <span className="block text-[13px] font-bold">potensi hasil dibanding {s.claim}</span>
            <span className="text-[11px] text-mute">Uji lapang {impact.source} · bukan prediksi</span>
          </span>
        </div>
      )}

      {steps.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="font-display text-[17px] font-bold">Yang perlu dilakukan</h2>
          {steps.map((t, i) => (
            <p key={t} className="flex items-center gap-2.5 text-[13px]">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-choc text-[11.5px] font-extrabold text-mint">{i + 1}</span>
              {t}
            </p>
          ))}
        </section>
      )}

      {(s.action || s.closed_at) && <FollowUp s={s} batchId={batchId!} base="/m/hasil" />}
      {(canRetest || canMark) && (
        <div className="flex gap-2.5 pt-1">
          {canRetest && (
            <button
              type="button"
              disabled={act.isPending}
              onClick={() => act.mutate('uji ulang')}
              className={cx('flex items-center justify-center gap-1.5 rounded-full border border-line bg-white px-5 py-3.5 text-[13.5px] font-bold', !canMark && 'flex-1')}
            >
              <RotateCcw size={16} /> Uji ulang
            </button>
          )}
          {canMark && (
            <button
              type="button"
              disabled={act.isPending}
              onClick={() => act.mutate('pemurnian')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-bad py-3.5 text-[13.5px] font-extrabold text-white disabled:opacity-60"
            >
              <Flag size={16} /> Tandai {unit}
            </button>
          )}
        </div>
      )}
      {act.error && (
        <p role="alert" className="rounded-2xl bg-bad-soft px-3.5 py-3 text-[12.5px] text-bad">
          {act.error.message}
        </p>
      )}
    </div>
  )
}

function Pill({ v }: { v: NonNullable<SampleDetail['verdict']> }) {
  const Icon = VERDICT_ICON[v]
  const hex = VERDICT[v].hex
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-extrabold tracking-[0.08em]"
      style={{ color: hex, borderColor: `${hex}66`, background: `${hex}26` }}
    >
      <Icon size={14} /> {v}
    </span>
  )
}
