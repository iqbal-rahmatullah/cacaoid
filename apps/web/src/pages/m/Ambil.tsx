import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Camera, Check, ChevronDown, CircleAlert, CircleCheck, CloudOff, LocateFixed, MapPinOff, QrCode, Save, X } from 'lucide-react'
import { get, req, type BatchSummary, type Clone, type Provider, type Risk } from '../../lib/api'
import { CHECKS, KINDS, clonesForKind, isKnownClaim, missingFields, nextSampleId, normalizeSampleId, progressFor, readyClones, searchClones } from '../../lib/field'
import { deviceStore, loadQueue } from '../../lib/queue'
import { keep, remember, useSampleQueue } from '../../lib/useSampleQueue'
import { useCurrentBatch } from '../../lib/useCurrentBatch'
import { SimBadge, cx } from '../../components/ui'

type Gps = { lat: number; lon: number; acc: number }
const field = 'w-full rounded-[14px] border border-line bg-white px-3.5 py-3 text-sm font-semibold outline-none focus:border-mint-deep'

export default function Ambil() {
  const qc = useQueryClient()
  const queue = useSampleQueue()
  const { batches, batchId, batch, choose } = useCurrentBatch()
  const clones = useQuery({ queryKey: ['clones'], queryFn: () => get<Clone[]>('/clones') })
  const providers = useQuery({ queryKey: ['providers'], queryFn: () => get<Provider[]>('/providers') })
  const risk = useQuery({ queryKey: ['risk'], queryFn: () => get<Risk[]>('/ai/risk') })


  const [f, setF] = useState(() => ({
    sample_id: '', claim: '', kind: remember('kind') || KINDS[0].value, lot: remember('lot'),
    officer: remember('officer'), provider: remember('provider'), regency: remember('regency'), province: remember('province'),
  }))
  const [checked, setChecked] = useState<string[]>([])
  const [gps, setGps] = useState<Gps | null>(null)
  const [gpsMsg, setGpsMsg] = useState('')
  const [locating, setLocating] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [confirmUnknown, setConfirmUnknown] = useState(false)
  const [saved, setSaved] = useState('')
  useEffect(() => setConfirmUnknown(false), [f.claim])

  const newBatch = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('name', `Lapangan ${new Date().toLocaleDateString('id-ID')} ${f.regency}`.trim())
      return req<BatchSummary>('/batches', { method: 'POST', body: fd })
    },
    onSuccess: (b) => {
      qc.setQueryData<BatchSummary[]>(['batches'], (list = []) => [...list, b]) // before the refetch, so selectBatch keeps it
      choose(b.id)
      qc.invalidateQueries({ queryKey: ['batches'] })
    },
  })

  const save = useMutation({
    networkMode: 'always', // TanStack Query would otherwise pause offline and hold the sample only in memory
    mutationFn: () =>
      queue.submit({
        batchId: batchId!,
        body: { ...f, sample_id: normalizeSampleId(f.sample_id), claim: f.claim.trim(), lat: gps?.lat ?? null, lon: gps?.lon ?? null, checklist: checked },
      }),
    onSuccess: (how) => {
      for (const k of ['kind', 'lot', 'officer', 'provider', 'regency', 'province'] as const) keep(k, f[k])
      const id = normalizeSampleId(f.sample_id)
      setSaved(how === 'terkirim' ? `${id} tersimpan.` : `${id} disimpan di ponsel. Terkirim otomatis saat ada sinyal.`)
      setF({ ...f, sample_id: '', claim: f.kind === 'bibit hibrida' ? f.claim : '' })
      setChecked([])
      setGps(null)
    },
  })

  const offered = clonesForKind(f.kind, readyClones(clones.data ?? []))
  const knownClaim = isKnownClaim(f.claim, offered)
  const checks = CHECKS[f.kind]
  const missing = missingFields({ batchId, sampleId: f.sample_id, claim: f.claim, checks, checked })
  const ready = missing.length === 0
  const target = risk.data?.find((r) => r.provider === f.provider)?.recommended_n
  const progress = target && batch.data ? progressFor(f.provider, batch.data.samples, target) : null
  const shortGarden = f.provider.replace('KE Simulasi ', 'KE ')
  const exampleId = scanning
    ? nextSampleId([
        ...(batch.data?.samples.map((x) => x.sample_id) ?? []),
        ...loadQueue(deviceStore()).filter((p) => p.batchId === batchId).map((p) => p.body.sample_id),
      ])
    : ''
  const gardenClones = providers.data?.find((p) => p.name === f.provider)?.clones ?? []

  const submit = () => {
    setSaved('')
    if (!knownClaim && !confirmUnknown) return setConfirmUnknown(true) // GAPS G-13: ask twice for unknown clones
    save.mutate()
  }

  const locate = () => {
    setGpsMsg('')
    if (!navigator.geolocation) return setGpsMsg('Perangkat tidak punya GPS.')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false)
        setGps({ lat: +p.coords.latitude.toFixed(5), lon: +p.coords.longitude.toFixed(5), acc: Math.round(p.coords.accuracy) })
      },
      (e) => {
        setLocating(false)
        setGpsMsg(e.code === 1 ? 'Izin lokasi ditolak. Sampel tetap bisa disimpan tanpa GPS.' : 'Lokasi belum didapat. Coba di tempat terbuka.')
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  const pickProvider = (name: string) => {
    const p = providers.data?.find((x) => x.name === name)
    setF({ ...f, provider: name, regency: p?.regency ?? f.regency, province: p?.province ?? f.province })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/m" aria-label="Kembali" className="grid size-10 place-items-center rounded-full border border-line bg-white">
          <ArrowLeft size={18} />
        </Link>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl font-bold tracking-tight">Ambil sampel</span>
          <span className="block truncate text-xs text-mute">
            {progress ? `${shortGarden} · ${progress.done} dari ${progress.target}` : (batch.data?.name ?? 'Memuat batch…')}
          </span>
        </span>
        <SimBadge />
      </div>

      {saved && (
        <p role="status" className="flex items-start gap-2 rounded-2xl bg-ok-soft px-3.5 py-3 text-[12.5px] font-semibold text-ok">
          <CircleCheck size={17} className="mt-px shrink-0" /> {saved}
        </p>
      )}
      {queue.pending > 0 && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-warn/20 bg-warn-soft px-3.5 py-3 text-[12.5px] text-[#7A4A00]">
          <CloudOff size={17} className="shrink-0 text-warn" />
          <span className="flex-1">
            <b>{queue.pending} sampel</b> menunggu sinyal.
          </span>
          {queue.online && (
            <button type="button" onClick={queue.sync} className="font-bold underline">
              Kirim sekarang
            </button>
          )}
        </div>
      )}
      {queue.rejected.map((r) => (
        <p key={r.sampleId} role="alert" className="rounded-2xl bg-bad-soft px-3.5 py-3 text-[12.5px] text-bad">
          Ditolak saat sinkron: <b>{r.sampleId}</b> · {r.message}
        </p>
      ))}

      <details className="group rounded-2xl border border-line bg-white px-3.5 py-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[12.5px]">
          <span className="min-w-0 truncate">
            <b>{batch.data?.name ?? 'Pilih batch'}</b>
            <span className="text-mute"> · {shortGarden || 'pilih kebun'}{f.officer && ` · ${f.officer}`}</span>
          </span>
          <span className="shrink-0 font-bold text-mint-deep group-open:hidden">Ubah</span>
        </summary>
        <div className="mt-3 space-y-3 text-xs font-bold text-body">
          <label className="block space-y-1.5">
            Batch
            <select className={field} value={batchId ?? ''} onChange={(e) => choose(Number(e.target.value) || null)}>
              {batches.data?.map((b) => (
                <option key={b.id} value={b.id}>
                  #{b.id} {b.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" disabled={newBatch.isPending} onClick={() => newBatch.mutate()} className="text-mint-deep disabled:text-mute">
            + Batch baru hari ini
          </button>
          <label className="block space-y-1.5">
            Kebun / penyedia
            <select className={field} value={f.provider} onChange={(e) => pickProvider(e.target.value)}>
              <option value="">— pilih kebun —</option>
              {providers.data?.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              Petugas
              <input className={field} value={f.officer} onChange={(e) => setF({ ...f, officer: e.target.value })} />
            </label>
            <label className="block space-y-1.5">
              Lot / blok
              <input className={field} value={f.lot} onChange={(e) => setF({ ...f, lot: e.target.value })} />
            </label>
          </div>
        </div>
      </details>

      <div className="space-y-3 rounded-[26px] bg-choc p-4 text-white">
        {scanning ? (
          <Scanner
            exampleId={exampleId}
            onCode={(code) => { setF({ ...f, sample_id: code }); setScanning(false) }}
            onClose={() => setScanning(false)}
          />
        ) : (
          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold tracking-wide text-white/60">ID sampel · sama dengan label kantong</span>
            <span className="flex gap-2">
              <input
                aria-label="ID sampel (label kantong)"
                className="min-w-0 flex-1 rounded-[14px] bg-cream px-3.5 py-3 font-mono text-[15px] font-bold text-ink uppercase outline-none placeholder:font-sans placeholder:font-semibold placeholder:text-mute placeholder:normal-case"
                value={f.sample_id}
                onChange={(e) => setF({ ...f, sample_id: e.target.value })}
                placeholder="ketik atau pindai"
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <button type="button" onClick={() => setScanning(true)} aria-label="Pindai label kantong" className="grid w-12 place-items-center rounded-[14px] bg-mint text-choc">
                <Camera size={20} />
              </button>
            </span>
          </label>
        )}
        <div className="flex items-center gap-2.5">
          {gps ? (
            <>
              <span className="grid size-[30px] place-items-center rounded-full bg-mint text-choc">
                <Check size={16} />
              </span>
              <span className="text-[12px] text-white/70">
                GPS {gps.lat} · {gps.lon} · ±{gps.acc} m
              </span>
            </>
          ) : (
            <button type="button" onClick={locate} disabled={locating} className="flex items-center gap-2 text-[12.5px] font-bold text-mint disabled:text-white/60">
              <LocateFixed size={16} className={locating ? 'animate-pulse' : ''} /> {locating ? 'Mencari lokasi… (izinkan akses lokasi)' : 'Ambil lokasi GPS'}
            </button>
          )}
        </div>
        {gpsMsg && (
          <p className="flex items-start gap-1.5 text-[11.5px] text-white/60">
            <MapPinOff size={13} className="mt-px shrink-0" /> {gpsMsg}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <span className="text-xs font-bold text-body">Jenis sampel</span>
        <div className="flex gap-1 rounded-[14px] bg-taupe-soft p-1">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              aria-pressed={k.value === f.kind}
              onClick={() => { setF({ ...f, kind: k.value, claim: '' }); setChecked([]) }}
              className={cx('flex-1 rounded-[11px] py-2.5 text-[12.5px] transition', k.value === f.kind ? 'bg-white font-extrabold shadow-sm' : 'font-semibold text-body')}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5 text-xs font-bold text-body">
        <span id="klon-diklaim">{f.kind === 'bibit hibrida' ? 'Hibrida yang diklaim (sesuai label)' : 'Klon yang diklaim (sesuai label)'}</span>
        <ClonePicker
          labelledBy="klon-diklaim"
          value={f.claim}
          clones={offered}
          garden={gardenClones}
          loading={clones.isPending}
          onPick={(name) => setF({ ...f, claim: name })}
        />
        {clones.isError && (
          <span role="alert" className="block font-semibold text-bad">
            Registri klon belum bisa dimuat: {clones.error.message}
          </span>
        )}
        {confirmUnknown && (
          <span className="flex items-start gap-1.5 font-semibold text-warn">
            <CircleAlert size={14} className="mt-px shrink-0" /> “{f.claim}” tidak ada di daftar klon siap verifikasi. Periksa ejaan, atau ketuk simpan sekali lagi.
          </span>
        )}
      </div>

      <div className="space-y-2.5 rounded-2xl border border-line bg-white p-3.5">
        {checks.map((c) => {
          const on = checked.includes(c)
          return (
            <button
              key={c}
              type="button"
              aria-pressed={on}
              onClick={() => setChecked(on ? checked.filter((x) => x !== c) : [...checked, c])}
              className="flex w-full items-center gap-2.5 text-left text-[12.5px]"
            >
              <span className={cx('grid size-[22px] shrink-0 place-items-center rounded-[7px] transition', on ? 'bg-mint-deep text-white' : 'border-2 border-line')}>
                {on && <Check size={14} />}
              </span>
              {c}
            </button>
          )
        })}
      </div>

      {save.error && (
        <p role="alert" className="rounded-2xl bg-bad-soft px-3.5 py-3 text-[12.5px] text-bad">
          {save.error.message}
        </p>
      )}
      <div className="space-y-2 pt-1 text-center">
        <button
          type="button"
          disabled={!ready || save.isPending}
          onClick={submit}
          className={cx(
            'flex w-full items-center justify-center gap-2 rounded-full py-4 text-[15px] font-extrabold text-white transition disabled:bg-line disabled:text-mute',
            confirmUnknown ? 'bg-warn' : 'bg-choc',
          )}
        >
          <Save size={18} className={ready ? 'text-mint' : ''} />
          {confirmUnknown ? 'Tetap simpan' : !gps ? 'Simpan tanpa GPS' : queue.online ? 'Simpan sampel' : 'Simpan ke antrean'}
        </button>
        <p className="text-[11.5px] text-mute">
          {ready ? 'Tersimpan di ponsel bila tidak ada sinyal · terkirim otomatis saat online' : `Belum diisi: ${missing.join(', ')}`}
        </p>
      </div>
    </div>
  )
}

type ClonePickerProps = { labelledBy: string; value: string; clones: Clone[]; garden: string[]; loading: boolean; onPick: (name: string) => void }

// Searchable select over the clone registry. Garden clones come first; a clone missing from the registry can still be
// recorded through the last option, and then the save button asks again (GAPS G-13).
function ClonePicker({ labelledBy, value, clones, garden, loading, onPick }: ClonePickerProps) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const panel = useRef<HTMLDivElement>(null)
  // The panel opens in the page flow (the floating tab bar would cover an overlay); scroll it clear of the tab bar.
  useEffect(() => {
    if (open) requestAnimationFrame(() => panel.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
  }, [open])
  const byName = new Map(clones.map((c) => [c.name, c]))
  const found = searchClones([...byName.keys()], q, garden, 60)
  const typed = q.trim()
  const hits = typed && found.length === 0 ? [typed] : found // free text only when the registry has no match
  const pick = (id: string) => {
    onPick(id)
    setOpen(false)
    setQ('')
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, hits.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && hits[active]) {
      e.preventDefault()
      pick(hits[active])
    } else if (e.key === 'Escape') setOpen(false)
  }
  return (
    <div className="min-w-0 flex-1" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelledBy}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-[14px] border border-line bg-white px-3.5 py-3 text-left text-ink"
      >
        {value ? (
          <span className="text-sm font-semibold">{value}</span>
        ) : (
          <span className="text-sm font-semibold text-mute">{loading ? 'Memuat registri klon…' : 'Pilih klon'}</span>
        )}
        <ChevronDown size={18} className="shrink-0 text-mute" />
      </button>
      {open && (
        <div ref={panel} className="mt-2 scroll-mb-24 rounded-2xl border border-line bg-white p-2 text-ink shadow-[0_16px_40px_-12px_rgba(28,17,12,0.35)]">
          <input
            autoFocus
            role="combobox"
            aria-expanded
            aria-controls="daftar-klon"
            aria-activedescendant={hits[active] ? `klon-${active}` : undefined}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKey}
            placeholder="Cari klon, mis. MCC, ICS 60"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-[10px] bg-cream px-3 py-2.5 text-sm outline-none"
          />
          <ul id="daftar-klon" role="listbox" className="mt-1.5 max-h-60 overflow-y-auto">
            {hits.map((name, i) => {
              const c = byName.get(name)
              const mine = garden.includes(name)
              return (
                <li
                  key={name}
                  id={`klon-${i}`}
                  role="option"
                  aria-selected={name === value}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(name)}
                  className={cx('flex cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2.5 text-sm', i === active && 'bg-mint-soft')}
                >
                  {c ? (
                    <>
                      <span className="flex-1 font-semibold">{name}</span>
                      {mine && <span className="rounded-full bg-mint-soft px-2 py-0.5 text-[10px] font-extrabold text-mint-deep">kebun ini</span>}
                      {name === value && <Check size={15} className="text-mint-deep" />}
                    </>
                  ) : (
                    <span className="flex-1 font-semibold text-warn">Pakai “{name}” (di luar daftar)</span>
                  )}
                </li>
              )
            })}
            {hits.length === 0 && <li className="px-3 py-2.5 text-sm text-mute">{loading ? 'Memuat…' : 'Ketik untuk mencari klon'}</li>}
          </ul>
          <p className="px-1 pt-1.5 text-[11px] text-mute">
            {clones.length} klon siap verifikasi{found.length === 60 ? ' · ketik untuk mempersempit' : ''}
          </p>
        </div>
      )}
    </div>
  )
}

type Detector = { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> }

// Reads the QR / Code 128 printed on the sample bag. BarcodeDetector is missing in some browsers: type the ID instead.
// "Contoh QR" plays the same flow with a mock label (DATA SIMULASI), for demos and laptops without a camera.
function Scanner({ exampleId, onCode, onClose }: { exampleId: string; onCode: (c: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const done = useRef(onCode)
  done.current = onCode
  const [err, setErr] = useState('')
  const [demo, setDemo] = useState(false)
  useEffect(() => {
    if (!demo) return
    const t = setTimeout(() => done.current(exampleId), 1400)
    return () => clearTimeout(t)
  }, [demo, exampleId])
  useEffect(() => {
    if (demo) return // switching to the mock label stops the camera (cleanup below)
    const BD = (window as unknown as { BarcodeDetector?: new (o: object) => Detector }).BarcodeDetector
    if (!BD) return setErr('Browser ini belum bisa memindai. Ketik ID di label kantong.')
    let stream: MediaStream | null = null
    let alive = true
    const det = new BD({ formats: ['qr_code', 'code_128'] })
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(async (s) => {
        stream = s
        if (!alive) return s.getTracks().forEach((t) => t.stop()) // permission came after the scanner closed
        if (!video.current) return
        video.current.srcObject = s
        await video.current.play()
        while (alive) {
          const codes = await det.detect(video.current).catch(() => [])
          if (codes[0]?.rawValue) return done.current(codes[0].rawValue.trim().toUpperCase())
          await new Promise((r) => setTimeout(r, 250))
        }
      })
      .catch(() => setErr('Kamera tidak bisa dibuka. Ketik ID di label kantong.'))
    return () => {
      alive = false
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [demo])
  return (
    <div className="relative grid h-[180px] place-items-center overflow-hidden rounded-[18px] bg-gradient-to-b from-[#3A2A20] to-[#20140E]">
      {demo ? (
        <MockLabel id={exampleId} />
      ) : err ? (
        <p className="px-6 pb-8 text-center text-[12.5px] text-white/80">{err}</p>
      ) : (
        <video ref={video} className="absolute inset-0 size-full object-cover" muted playsInline />
      )}
      <div className="pointer-events-none absolute inset-x-12 inset-y-3">
        {['top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-lg', 'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-lg', 'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-lg', 'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-lg'].map((c) => (
          <span key={c} className={cx('absolute size-6 border-mint', c)} />
        ))}
      </div>
      {(demo || !err) && <span className="scan-line absolute inset-x-8 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-mint to-transparent" />}
      <button type="button" onClick={onClose} aria-label="Tutup pemindai" className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-white/15">
        <X size={16} />
      </button>
      {demo ? (
        <span role="status" className="absolute bottom-2.5 text-[11.5px] font-semibold text-white/75">Membaca label…</span>
      ) : (
        <button
          type="button"
          onClick={() => setDemo(true)}
          className="absolute bottom-2.5 flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11.5px] font-bold text-white backdrop-blur"
        >
          <QrCode size={14} /> Contoh QR (simulasi)
        </button>
      )}
    </div>
  )
}

// Mock bag label. The QR-like grid is decorative (seeded by the ID); a printed label would carry a real QR of the same ID.
function MockLabel({ id }: { id: string }) {
  const n = 21
  let h = [...id].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) >>> 0, 7)
  const corner = (r: number, c: number) => {
    for (const [or, oc] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
      const y = r - or
      const x = c - oc
      if (y >= -1 && y <= 7 && x >= -1 && x <= 7) {
        if (y < 0 || y > 6 || x < 0 || x > 6) return false // white ring around the finder square
        return y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4)
      }
    }
    return null
  }
  const cells = Array.from({ length: n * n }, (_, i) => {
    const fixed = corner(Math.floor(i / n), i % n)
    if (fixed !== null) return fixed
    h = (Math.imul(h, 1103515245) + 12345) >>> 0
    return (h >>> 16) % 2 === 0
  })
  return (
    <div className="flex items-center gap-3 rounded-xl bg-cream p-2.5 pr-4 text-ink shadow-lg">
      <div className="grid size-[84px] grid-cols-[repeat(21,1fr)] bg-white p-1">
        {cells.map((on, i) => (
          <span key={i} className={on ? 'bg-choc' : ''} />
        ))}
      </div>
      <div>
        <p className="text-[9.5px] font-extrabold tracking-[0.1em] text-mute">LABEL KANTONG</p>
        <p className="font-mono text-[17px] font-bold">{id}</p>
        <p className="text-[10px] font-semibold text-warn">contoh · DATA SIMULASI</p>
      </div>
    </div>
  )
}
