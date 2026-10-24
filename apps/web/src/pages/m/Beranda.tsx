import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CloudOff, RefreshCw, ScanLine } from 'lucide-react'
import { get, type Risk } from '../../lib/api'
import { byAttention, initials, progressFor } from '../../lib/field'
import { remember, useSampleQueue } from '../../lib/useSampleQueue'
import { useCurrentBatch } from '../../lib/useCurrentBatch'
import { Dark, ResultRow, SimBadge } from '../../components/ui'

const greeting = () => {
  const h = new Date().getHours()
  return h < 11 ? 'Selamat pagi,' : h < 15 ? 'Selamat siang,' : h < 19 ? 'Selamat sore,' : 'Selamat malam,'
}

export default function Beranda() {
  const queue = useSampleQueue()
  const { batchId, batch } = useCurrentBatch()
  const risk = useQuery({ queryKey: ['risk'], queryFn: () => get<Risk[]>('/ai/risk') })
  const officer = remember('officer') || 'Pengawas benih'
  const provider = remember('provider')
  const plan = risk.data?.find((r) => r.provider === provider)
  const progress = plan && batch.data ? progressFor(provider, batch.data.samples, plan.recommended_n) : null
  const results = byAttention(batch.data?.samples ?? [])
  const waiting = batch.data?.samples.filter((s) => !s.is_control && s.verdict === null).length ?? 0

  return (
    <div className="space-y-5 pt-1">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-pod text-sm font-extrabold text-choc">{initials(officer)}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12.5px] text-mute">{greeting()}</span>
          <span className="block truncate font-display text-xl font-bold tracking-tight">{officer}</span>
        </span>
        <SimBadge />
      </div>

      {(!queue.online || queue.pending > 0) && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-warn/20 bg-warn-soft px-3.5 py-3">
          <CloudOff size={18} className="shrink-0 text-warn" />
          <span className="flex-1">
            <span className="block text-[12.5px] font-bold text-[#7A4A00]">
              {queue.online ? 'Ada sinyal' : 'Tanpa sinyal'} · {queue.pending} sampel di antrean
            </span>
            <span className="text-[11.5px] text-[#9A6A1F]">Terkirim otomatis saat online</span>
          </span>
          {queue.online && queue.pending > 0 && (
            <button type="button" onClick={queue.sync} aria-label="Kirim sekarang" className="text-warn">
              <RefreshCw size={18} />
            </button>
          )}
        </div>
      )}

      <Dark glows={[['#3DDC97', '100% 0%', '160% 120%']]} className="space-y-3.5 rounded-[28px] p-[22px]">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-extrabold tracking-[0.12em] text-mint">ANJURAN SAMPLING</span>
          {plan && (
            <span className="rounded-full bg-pod/20 px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#FFB27A]">Risiko {plan.tier.toLowerCase()}</span>
          )}
        </div>
        {provider ? (
          <>
            <p className="font-display text-[26px] leading-none font-bold tracking-tight">{provider.replace('KE Simulasi ', 'KE ')}</p>
            {progress ? (
              <>
                <p className="flex items-end gap-2">
                  <span className="font-display text-[54px] leading-[0.9] font-bold tracking-[-0.04em] text-mint">{progress.done}</span>
                  <span className="pb-1 text-base font-bold text-white/60">/ {progress.target} daun</span>
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-mint" style={{ width: `${Math.min(100, (progress.done / progress.target) * 100)}%` }} />
                </div>
                <p className="text-xs text-white/55">
                  Jumlah dianjurkan dari riwayat kebun · {Math.max(0, progress.target - progress.done)} lagi di batch ini
                </p>
              </>
            ) : (
              <p className="text-xs text-white/55">{risk.isError ? 'Anjuran belum bisa dimuat.' : 'Memuat anjuran…'}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-white/70">Pilih kebun di halaman Ambil sampel untuk melihat berapa daun yang dianjurkan.</p>
        )}
        <Link to="/m/ambil" className="flex items-center justify-center gap-2 rounded-full bg-mint py-3.5 text-[14.5px] font-extrabold text-choc">
          <ScanLine size={18} /> {progress?.done ? 'Lanjut ambil sampel' : 'Ambil sampel'}
        </Link>
      </Dark>

      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Perlu perhatian</h2>
          <Link to="/m/hasil" className="text-[13px] font-bold text-mint-deep">
            Semua
          </Link>
        </div>
        {batch.isPending ? (
          <p className="text-sm text-mute">Memuat hasil lab…</p>
        ) : batch.isError ? (
          <p role="alert" className="rounded-2xl bg-bad-soft px-3.5 py-3 text-[12.5px] text-bad">
            Hasil lab belum bisa dimuat: {batch.error.message}
          </p>
        ) : results.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-3.5 py-4 text-center text-[12.5px] text-body">
            Belum ada hasil lab di batch ini{waiting ? ` · ${waiting} sampel menunggu lab` : ''}.
          </p>
        ) : (
          results.slice(0, 3).map((r) => (
            <ResultRow
              key={r.sample_id}
              to={`/m/hasil/${batchId}/${r.sample_id}`}
              id={r.sample_id}
              v={r.verdict}
              detail={r.found_as ? `Label ${r.claim} · DNA ${r.found_as}` : `${r.claim} · ${r.kind}`}
            />
          ))
        )}
      </section>
    </div>
  )
}
