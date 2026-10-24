import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { byAttention } from '../../lib/field'
import { useCurrentBatch } from '../../lib/useCurrentBatch'
import { ResultRow, SimBadge } from '../../components/ui'

export default function HasilPonsel() {
  const { batchId, batch } = useCurrentBatch()
  const results = byAttention(batch.data?.samples ?? [])
  const waiting = batch.data?.samples.filter((s) => !s.is_control && s.verdict === null).length ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/m" aria-label="Kembali" className="grid size-10 place-items-center rounded-full border border-line bg-white">
          <ArrowLeft size={18} />
        </Link>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl font-bold tracking-tight">Hasil lab</span>
          <span className="block truncate text-xs text-mute">
            {batch.data ? `${batch.data.name} · ${results.length} hasil${waiting ? ` · ${waiting} menunggu lab` : ''}` : 'Memuat…'}
          </span>
        </span>
        <SimBadge />
      </div>

      {batch.isError && (
        <p role="alert" className="rounded-2xl bg-bad-soft px-3.5 py-3 text-[12.5px] text-bad">
          Hasil lab belum bisa dimuat: {batch.error.message}
        </p>
      )}
      {batch.data && results.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line px-3.5 py-4 text-center text-[12.5px] text-body">
          Belum ada hasil lab di batch ini. Ganti batch di halaman Ambil sampel.
        </p>
      )}
      <div className="space-y-2.5">
        {results.map((r) => (
          <ResultRow
            key={r.sample_id}
            to={`/m/hasil/${batchId}/${r.sample_id}`}
            id={r.sample_id}
            v={r.verdict}
            detail={r.found_as ? `Label ${r.claim} · DNA ${r.found_as}` : `${r.claim} · ${r.provider.replace('KE Simulasi ', 'KE ')}`}
          />
        ))}
      </div>
    </div>
  )
}
