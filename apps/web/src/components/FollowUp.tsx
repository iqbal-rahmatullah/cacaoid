import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, CircleCheck, Hourglass, LoaderCircle, ScanLine } from 'lucide-react'
import { sendForm, type SampleDetail } from '../lib/api'
import { todayIso } from '../lib/field'
import { longDate } from '../lib/results'
import { VerdictPill, cx } from './ui'

// Closed follow-up cycle (ROADMAP Fase 2): a retest links a new sample and closes the case when its result settles it;
// pemurnian closes with a date and a photo of the replaced tree. `base` is where sample links go (web or phone).
export function FollowUp({ s, batchId, base }: { s: SampleDetail; batchId: string; base: '/hasil' | '/m/hasil' }) {
  if (s.closed_at)
    return (
      <div role="status" className="space-y-2.5 rounded-[18px] bg-ok-soft px-4 py-3.5 text-ok">
        <p className="flex items-start gap-2 text-[13px] font-bold">
          <CircleCheck size={17} className="mt-px shrink-0" /> Kasus ditutup {longDate(s.closed_at)} · {s.outcome}
        </p>
        {s.evidence.photo && (
          <a href={`/api/evidence/${s.evidence.photo}`} target="_blank" rel="noreferrer" className="flex items-center gap-3">
            <img src={`/api/evidence/${s.evidence.photo}`} alt="Foto bukti pemurnian" className="size-16 rounded-xl object-cover" />
            <span className="text-[11.5px] text-body">
              Bukti foto · {longDate(s.evidence.date)}
              {s.evidence.note && <span className="block">{s.evidence.note}</span>}
              <span className="block font-mono text-[10px] text-mute">sha256 {s.evidence.sha256?.slice(0, 12)}…</span>
            </span>
          </a>
        )}
      </div>
    )
  if (s.action === 'pemurnian') return <CloseCase s={s} batchId={batchId} />
  if (s.action !== 'uji ulang') return null
  return (
    <div className="space-y-2.5 rounded-[18px] border border-line bg-white px-4 py-3.5">
      <p className="flex items-center gap-2 text-[13px] font-bold">
        <Hourglass size={16} className="text-info" /> Uji ulang diminta
      </p>
      {s.outcome && <p className="text-[12.5px] font-semibold text-bad">{s.outcome}. Pohon masih perlu ditandai untuk pemurnian.</p>}
      {s.retests.length ? (
        s.retests.map((r) => (
          <Link key={r.sample_id} to={`${base}/${r.batch_id}/${encodeURIComponent(r.sample_id)}`} className="flex items-center justify-between gap-2 rounded-xl bg-cream px-3 py-2">
            <span className="font-mono text-[12.5px] font-bold">{r.sample_id}</span>
            {r.verdict ? <VerdictPill v={r.verdict} /> : <span className="text-[11.5px] text-mute">menunggu lab</span>}
          </Link>
        ))
      ) : (
        <p className="text-[12.5px] text-body">Belum ada sampel ulang. Ambil daun baru dari pohon yang sama dengan label kantong baru.</p>
      )}
      {!s.retests.some((r) => !r.verdict) && (
        <Link
          to={`/m/ambil?ulang=${encodeURIComponent(s.sample_id)}&batch=${batchId}`}
          className="flex items-center justify-center gap-2 rounded-full bg-choc py-2.5 text-[12.5px] font-bold text-white"
        >
          <ScanLine size={15} className="text-mint" /> Ambil sampel ulang
        </Link>
      )}
    </div>
  )
}

function CloseCase({ s, batchId }: { s: SampleDetail; batchId: string }) {
  const qc = useQueryClient()
  const [date, setDate] = useState(todayIso())
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const unit = s.kind.startsWith('bibit') ? 'bibit' : 'pohon'
  const close = useMutation({
    mutationFn: () => {
      const f = new FormData()
      f.append('date', date)
      f.append('note', note)
      if (photo) f.append('photo', photo)
      return sendForm(`/batches/${batchId}/samples/${encodeURIComponent(s.sample_id)}/close`, f)
    },
    onSuccess: () => {
      for (const key of [['sample', batchId, s.sample_id], ['batch'], ['dashboard']]) qc.invalidateQueries({ queryKey: key })
    },
  })
  const offline = typeof navigator !== 'undefined' && !navigator.onLine

  return (
    <form
      className="space-y-3 rounded-[18px] border border-line bg-white px-4 py-3.5"
      onSubmit={(e) => {
        e.preventDefault()
        close.mutate()
      }}
    >
      <div>
        <p className="text-[13px] font-bold">Tutup kasus: {unit} sudah diganti</p>
        <p className="text-[11.5px] text-mute">Butuh tanggal dan foto {unit} pengganti sebagai bukti. Tercatat di jejak audit.</p>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <label className="space-y-1 text-[11.5px] font-bold text-body">
          Tanggal pemurnian
          <input type="date" required max={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-line px-3 py-2 text-[13px] font-semibold" />
        </label>
        <label className="space-y-1 text-[11.5px] font-bold text-body">
          Foto bukti
          <span className={cx('flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-[12.5px] font-semibold', photo ? 'border-mint-deep text-mint-deep' : 'border-dashed border-mute/50 text-body')}>
            <Camera size={15} /> <span className="truncate">{photo ? photo.name : 'Ambil atau pilih foto'}</span>
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          </span>
        </label>
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan, mis. diganti entres MCC 01 terverifikasi" className="w-full rounded-xl border border-line px-3 py-2 text-[13px]" />
      {close.error && <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-[12px] text-bad">{close.error.message}</p>}
      <button
        type="submit"
        disabled={!photo || !date || close.isPending || offline}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-choc py-2.5 text-[13px] font-bold text-white disabled:bg-line disabled:text-mute"
      >
        {close.isPending && <LoaderCircle size={15} className="animate-spin" />} {offline ? 'Butuh sinyal untuk mengirim foto' : 'Tutup kasus'}
      </button>
    </form>
  )
}
