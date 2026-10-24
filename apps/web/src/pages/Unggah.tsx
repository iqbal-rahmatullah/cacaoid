import { useState, type DragEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, FileCheck, FileSpreadsheet, FileUp, LoaderCircle, Play, TriangleAlert } from 'lucide-react'
import { download, get, post, text, upload, type BatchQc, type Clone } from '../lib/api'
import { labChecks, longDate, pct, plateWells, type WellState } from '../lib/results'
import { useCurrentBatch } from '../lib/useCurrentBatch'
import { BatchBar, TopBar } from '../components/TopBar'
import { Card, CardHead, Dark, Empty, Loading, Problem, TONE, cx, useSimulated } from '../components/ui'

const WELL: Record<WellState, { cls: string; label: string }> = {
  hi: { cls: 'bg-mint-deep', label: '≥ 95%' },
  mid: { cls: 'bg-mint', label: '90–95%' },
  low: { cls: 'bg-[#FFC24B]', label: '85–90%' },
  fail: { cls: 'bg-bad', label: '< 85% · uji ulang' },
  pos: { cls: 'bg-choc ring-[3px] ring-inset ring-mint', label: 'kontrol positif' },
  ntc: { cls: 'bg-white ring-2 ring-inset ring-choc', label: 'kontrol negatif' },
  wait: { cls: 'bg-taupe-soft ring-1 ring-inset ring-taupe/40', label: 'belum ada hasil lab' },
  empty: { cls: 'bg-cream', label: 'sumur kosong' },
}
const ROWS = 'ABCDEFGH'

export default function Unggah() {
  const current = useCurrentBatch()
  const { batchId, batch } = current
  const qc = useQueryClient()
  const navigate = useNavigate()
  const simulated = useSimulated()
  const [plateNo, setPlateNo] = useState(1)
  const clones = useQuery({ queryKey: ['clones'], queryFn: () => get<Clone[]>('/clones') })
  const manifest = useQuery({ queryKey: ['manifest', batchId], enabled: !!batchId, queryFn: () => text(`/batches/${batchId}/manifest.csv`) })
  const refresh = () => {
    for (const key of [['batch', batchId], ['batches'], ['manifest', batchId], ['dashboard'], ['risk']]) qc.invalidateQueries({ queryKey: key })
  }
  const send = useMutation({ mutationFn: (file: File) => upload<BatchQc>(`/batches/${batchId}/lab`, 'lab', file), onSuccess: refresh })
  const run = useMutation({
    mutationFn: () => post(`/batches/${batchId}/analyze`, {}),
    onSuccess: () => {
      refresh()
      navigate('/hasil')
    },
  })
  const save = useMutation({ mutationFn: download })

  const b = batch.data
  const checks = labChecks(b?.qc ?? {})
  // A manifest always lists the two control wells; with no samples there is no plate to show yet.
  const plates = b?.n_samples && manifest.data ? plateWells(manifest.data, b.samples, b.qc.min_call_rate) : []
  const plate = plates.find((p) => p.plate === plateNo) ?? plates[0]
  const failed = plates.flatMap((p) => p.wells.filter((w) => w.state === 'fail').map((w) => ({ ...w, plate: p.plate })))
  const rate = new Map(b?.samples.map((s) => [s.sample_id, s.call_rate]))
  const ready = (clones.data ?? []).filter((c) => c.status === 'referensi').length
  // Samples recorded after this batch's lab results came in: the lab never received them.
  // Samples the uploaded lab file does not cover (recorded after it, or missing from it). While the batch has no verdict
  // yet, uploading a fuller file costs nothing; once it has verdicts, replacing the file would wipe them.
  const late = b?.lab_file ? b.samples.filter((s) => !s.is_control && s.call_rate == null).map((s) => s.sample_id) : []
  const tested = Object.keys(b?.counts ?? {}).length > 0
  const empty = !!b && b.n_samples === 0
  const pick = (files: FileList | null) => files?.[0] && send.mutate(files[0])
  const drop = (e: DragEvent) => {
    e.preventDefault()
    pick(e.dataTransfer.files)
  }

  const steps = [
    { state: batchId ? 'done' : 'now', title: 'Pilih batch', detail: b ? `${b.name} · ${b.n_samples} sampel` : 'Pilih atau buat batch di atas' },
    { state: b?.lab_file ? 'done' : batchId ? 'now' : 'next', title: 'Unggah file genotipe', detail: b?.lab_file ? `${b.lab_file} · sudah diperiksa` : 'CSV atau Excel dari lab' },
    {
      state: b?.analyzed_at && tested ? 'done' : b?.lab_file ? 'now' : 'next',
      title: 'Jalankan verifikasi',
      detail: b?.analyzed_at && tested ? `selesai ${longDate(b.analyzed_at)}` : `untuk ${b?.n_samples ?? 0} sampel`,
    },
  ] as const

  const runAction = { icon: Play, label: b?.analyzed_at ? 'Jalankan ulang' : 'Jalankan verifikasi', onClick: () => run.mutate(), disabled: !b?.lab_file || !b?.n_samples, busy: run.isPending }

  return (
    <>
      <TopBar
        crumb={['Verifikasi', 'Unggah hasil lab']}
        title="Unggah hasil lab"
        sub={b ? `${b.name} · ${b.n_samples} sampel${plates.length ? ` · ${plates.length} plate` : ''}` : 'File genotipe dari lab terakreditasi mana pun'}
        secondary={{ icon: FileSpreadsheet, label: 'Manifest plate', onClick: () => save.mutate(`/batches/${batchId}/manifest.csv`), disabled: !b?.n_samples }}
        primary={runAction}
      />
      {save.error && <Problem what="File" verb="diunduh" error={save.error} className="mt-4" />}
      {run.error && <Problem what="Verifikasi" verb="dijalankan" error={run.error} className="mt-4" />}

      <BatchBar current={current} canCreate note="Satu batch = satu kiriman ke lab. Sampelnya dicatat di ponsel (Ambil sampel)." />

      {current.batches.isError ? (
        <Problem what="Daftar batch" error={current.batches.error} className="mt-6" />
      ) : current.batches.data?.length === 0 ? (
        <Empty className="mt-6">
          Belum ada batch. Buat batch di atas, lalu catat sampelnya di{' '}
          <Link to="/m/ambil" className="font-bold text-mint-deep hover:underline">
            Ambil sampel
          </Link>
          .
        </Empty>
      ) : batch.isError ? (
        <Problem what="Batch" error={batch.error} className="mt-6" />
      ) : !b ? (
        <Loading className="mt-6" />
      ) : (
        <>
          {late.length > 0 && (
            <p className="mt-4 flex gap-2.5 rounded-[16px] border border-warn/25 bg-warn-soft px-4 py-3 text-[12.5px] text-[#7A4A00]">
              <TriangleAlert size={16} className="mt-0.5 shrink-0 text-warn" />
              <span>
                <b>
                  {late.length} sampel ({late.slice(0, 4).join(', ')}
                  {late.length > 4 ? ', …' : ''}) tidak ada di file lab
                </b>
                , jadi belum punya hasil.{' '}
                {tested
                  ? 'Mengganti file lab akan menghapus vonis dan tindak lanjut seluruh batch. Buat batch baru untuk kiriman lab berikutnya dan catat sampel itu di sana.'
                  : 'Batch ini belum punya vonis, jadi aman: unggah ulang file lab yang memuat sampel tersebut (Ganti berkas), lalu jalankan verifikasi.'}
              </span>
            </p>
          )}
          <Card className="mt-6 flex flex-col gap-4 px-6 py-[18px] md:flex-row md:items-center">
            {steps.map((s, i) => (
              <div key={s.title} className="flex flex-1 items-center gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className={cx(
                      'grid size-9 shrink-0 place-items-center rounded-full text-sm font-extrabold',
                      s.state === 'done' && 'bg-mint text-choc',
                      s.state === 'now' && 'bg-choc text-mint',
                      s.state === 'next' && 'border border-line bg-cream text-mute',
                    )}
                  >
                    {s.state === 'done' ? <Check size={18} /> : i + 1}
                  </span>
                  <span>
                    <span className={cx('block text-sm font-bold', s.state === 'next' && 'text-mute')}>{s.title}</span>
                    <span className="block text-xs text-mute">{s.detail}</span>
                  </span>
                </div>
                {i < steps.length - 1 && <span className={cx('hidden h-0.5 flex-1 rounded md:block', s.state === 'done' ? 'bg-mint' : 'bg-line')} />}
              </div>
            ))}
          </Card>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_372px]">
            <div className="flex flex-col gap-5">
              {empty && (
                <Empty>
                  Batch ini belum punya sampel. Catat sampelnya dulu di{' '}
                  <Link to="/m/ambil" className="font-bold text-mint-deep hover:underline">
                    Ambil sampel
                  </Link>
                  ; file lab dibuat untuk sampel yang sudah tercatat.
                </Empty>
              )}
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={empty ? (e) => e.preventDefault() : drop}
                className={cx(
                  'flex items-center gap-3.5 rounded-[20px] border px-[18px] py-4',
                  empty ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                  b.lab_file ? 'border-mint-deep/25 bg-mint-soft' : 'border-dashed border-mute/40 bg-white hover:border-mint-deep',
                )}
              >
                <input type="file" accept=".csv,.txt,.xlsx" className="sr-only" disabled={send.isPending || empty} onChange={(e) => { pick(e.target.files); e.target.value = '' }} />
                <span className="grid size-11 place-items-center rounded-[13px] bg-white text-mint-deep">
                  {send.isPending ? <LoaderCircle size={21} className="animate-spin" /> : b.lab_file ? <FileCheck size={21} /> : <FileUp size={21} />}
                </span>
                <span className="min-w-0 flex-1">
                  {b.lab_file ? (
                    <>
                      <span className="block font-mono text-sm font-bold">{b.lab_file}</span>
                      <span className="block text-xs text-body">
                        {b.qc.n_samples} sampel × {b.qc.panel_used?.length ?? 0} SNP panel · DNA terbaca rata-rata {pct(b.qc.mean_call_rate ?? 0)}
                        {b.analyzed_at && ' · mengganti file menghapus vonis dan tindak lanjut batch ini'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="block text-sm font-bold">{send.isPending ? 'Memeriksa file…' : 'Pilih atau tarik file genotipe ke sini'}</span>
                      <span className="block text-xs text-body">CSV (koma atau titik koma) atau Excel .xlsx, satu baris per sampel</span>
                    </>
                  )}
                </span>
                <span className="rounded-full border border-line bg-white px-3.5 py-2 text-[12.5px] font-bold">{b.lab_file ? 'Ganti berkas' : 'Pilih file'}</span>
              </label>
              {send.error && <Problem what="File lab" verb="diperiksa" error={send.error} />}
              {simulated && !empty && (!b.lab_file || (late.length > 0 && !tested)) && (
                <p className="-mt-2 text-[12.5px] text-body">
                  Belum ada lab untuk demo?{' '}
                  <button type="button" onClick={() => save.mutate(`/simulasi/lab.csv?batch_id=${batchId}`)} className="font-bold text-mint-deep hover:underline">
                    Unduh contoh file lab untuk batch ini (DATA SIMULASI)
                  </button>{' '}
                  <span className="text-mute">· sebagian sampel sengaja dibuat bermasalah, seperti di lapangan</span>
                </p>
              )}
              {(b.qc.warnings ?? []).map((w) => (
                <p key={w} className="flex gap-2.5 rounded-[16px] border border-warn/25 bg-warn-soft px-4 py-3 text-[12.5px] text-[#7A4A00]">
                  <TriangleAlert size={16} className="mt-0.5 shrink-0 text-warn" /> {w}
                </p>
              ))}

              <Card className="flex-1">
                <CardHead
                  title="Peta plate · DNA terbaca per sumur"
                  sub={plate ? `Plate ${plate.plate} dari ${plates.length} · 96 sumur · baris A–H × kolom 1–12 · posisi dari manifest` : 'Posisi sumur mengikuti manifest plate'}
                  right={
                    plates.length > 1 && (
                      <div className="flex gap-1 rounded-full bg-cream p-1 text-xs font-bold">
                        {plates.map((p) => (
                          <button
                            key={p.plate}
                            type="button"
                            onClick={() => setPlateNo(p.plate)}
                            className={cx('rounded-full px-3.5 py-1.5', p.plate === plate?.plate ? 'bg-white' : 'text-mute')}
                          >
                            Plate {p.plate}
                          </button>
                        ))}
                      </div>
                    )
                  }
                />
                {manifest.isError ? (
                  <Problem what="Manifest plate" error={manifest.error} className="mt-5" />
                ) : !plate ? (
                  <Empty className="mt-5">{manifest.isPending ? 'Memuat manifest…' : 'Belum ada sampel di batch ini.'}</Empty>
                ) : (
                  <>
                    <div className="mt-5 overflow-x-auto">
                      <div className="grid w-max grid-cols-[18px_repeat(12,38px)] gap-2 text-center text-[10.5px] font-bold text-mute">
                        <span />
                        {Array.from({ length: 12 }, (_, c) => (
                          <span key={c}>{c + 1}</span>
                        ))}
                        {Array.from({ length: 8 }, (_, r) => [
                          <span key={`r${r}`} className="self-center text-left">
                            {ROWS[r]}
                          </span>,
                          ...Array.from({ length: 12 }, (_, c) => {
                            const w = plate.wells[c * 8 + r]
                            const cr = rate.get(w.id)
                            return (
                              <span
                                key={w.well}
                                title={w.id ? `${w.well} · ${w.id} · ${cr == null ? WELL[w.state].label : `DNA ${pct(cr, 0)}`}` : `${w.well} · kosong`}
                                className={cx('size-[38px] rounded-full transition hover:scale-110', WELL[w.state].cls)}
                              />
                            )
                          }),
                        ])}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                      {Object.values(WELL).map((w) => (
                        <span key={w.label} className="flex items-center gap-1.5 text-[11.5px] font-semibold text-body">
                          <span className={cx('size-3 rounded-full', w.cls)} />
                          {w.label}
                        </span>
                      ))}
                    </div>
                  </>
                )}
                {failed.length > 0 && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {failed.map((w) => (
                      <div key={`${w.plate}${w.well}`} className="flex items-center gap-2.5 rounded-[14px] bg-bad-soft px-3 py-2.5">
                        <span className="grid size-[34px] place-items-center rounded-full bg-bad text-[11.5px] font-extrabold text-white">{w.well}</span>
                        <span>
                          <span className="block text-[12.5px] font-bold">
                            {w.id} · DNA terbaca {pct(rate.get(w.id) ?? 0, 0)}
                          </span>
                          <span className="block text-[11.5px] text-body">Otomatis jadi UJI ULANG, bukan OFF-TYPE</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div className="flex flex-col gap-5">
              <Card className="flex-1 px-[22px] py-5">
                <CardHead title="Pemeriksaan otomatis" sub="Dijalankan sebelum ada vonis" />
                {checks.length ? (
                  <ul className="mt-2">
                    {checks.map((c) => {
                      const t = TONE[c.tone]
                      return (
                        <li key={c.label} className="flex items-center gap-2.5 border-b border-line py-2.5 last:border-0">
                          <span className={cx('grid size-[26px] place-items-center rounded-lg', t.soft, t.text)}>
                            <t.icon size={14} />
                          </span>
                          <span className="flex-1 text-[12.5px] text-body">{c.label}</span>
                          <span className={cx('text-[12.5px] font-bold', c.tone === 'warn' && 'text-warn', c.tone === 'bad' && 'text-bad')}>{c.value}</span>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="mt-3 text-[12.5px] text-body">ID sampel, kelengkapan panel, untai DNA, kontrol plate, dan DNA terbaca diperiksa begitu file diunggah.</p>
                )}
              </Card>

              <Dark glows={[['#3DDC97', '100% 100%', '140% 140%']]} className="p-[22px]">
                <p className="text-[10.5px] font-extrabold tracking-[0.1em] text-mint">{b.analyzed_at && tested ? 'SUDAH DIVERIFIKASI' : b.lab_file ? 'SIAP DIVERIFIKASI' : 'MENUNGGU FILE LAB'}</p>
                <div className="mt-3 flex gap-5">
                  {[
                    [b.n_samples, 'sampel'],
                    [b.qc.panel_used?.length ?? '—', 'SNP'],
                    [ready || '—', 'klon referensi'],
                  ].map(([n, l]) => (
                    <span key={l}>
                      <span className="block font-display text-[30px] leading-none font-bold tracking-tight">{n}</span>
                      <span className="text-[11.5px] text-white/50">{l}</span>
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => run.mutate()}
                  disabled={!b.lab_file || !b.n_samples || run.isPending}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-mint py-3.5 text-sm font-extrabold text-choc transition hover:brightness-105 disabled:bg-white/15 disabled:text-white/50"
                >
                  {run.isPending ? <LoaderCircle size={16} className="animate-spin" /> : <Play size={16} />} {runAction.label}
                </button>
              </Dark>
            </div>
          </div>
        </>
      )}
    </>
  )
}
