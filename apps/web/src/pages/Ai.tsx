import { useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import {
  Check, CloudSun, Dices, FileUp, GitFork, LoaderCircle, LocateFixed, MapPin, Shuffle, Sparkles, Sprout, TriangleAlert, Wheat, X,
} from 'lucide-react'
import {
  download, get, post, text, upload, type Clone, type CrossResult, type MixAdvice, type ReflexQueue, type SampleAncestry, type SeedlingRanking,
  type WhereResult,
} from '../lib/api'
import { gardenPoints } from '../lib/results'
import { useCurrentBatch } from '../lib/useCurrentBatch'
import { BatchPicker, TopBar } from '../components/TopBar'
import { AncestryBar, TraitList } from '../components/AiParts'
import { ClonesInput } from '../components/ClonesInput'
import { Card, CardHead, Dark, Empty, IconTile, Loading, Problem, VerdictPill, cx, useSimulated } from '../components/ui'

// Analitik AI for breeders. What each model may and may not claim is fixed in apps/api/tasks/VALIDASI_MODEL.md:
// accuracy figures stay internal (not shown here), black pod ranks seedlings within ONE cross only, ancestry is an
// estimate, yield components need genome-wide genotypes.
const TABS = [
  ['semaian', 'Semaian & silangan', Sprout],
  ['refleks', 'Pohon tak dikenal', GitFork],
  ['kebun', 'Campuran klon & lokasi', MapPin],
] as const

export default function Ai() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.find(([k]) => k === params.get('tab'))?.[0] ?? 'semaian'
  return (
    <>
      <TopBar crumb={['AI & laporan', 'Analitik AI']} title="Analitik AI · alat pemulia" sub="Model dilatih pada data terbuka dan dipakai hanya untuk yang lolos validasi" />
      <nav className="mt-5 flex flex-wrap gap-1.5">
        {TABS.map(([k, label, Icon]) => (
          <button
            key={k}
            type="button"
            onClick={() => setParams({ tab: k }, { replace: true })}
            className={cx('flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold', tab === k ? 'bg-choc text-white' : 'border border-line bg-white text-body hover:bg-cream')}
          >
            <Icon size={15} className={tab === k ? 'text-[#B9A2FF]' : 'text-bean'} /> {label}
          </button>
        ))}
      </nav>
      {tab === 'semaian' && <SeedlingsTab />}
      {tab === 'refleks' && <ReflexTab />}
      {tab === 'kebun' && <GardenTab />}
    </>
  )
}

function SeedlingsTab() {
  return (
    <>
      <BlackPod />
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <CrossCard />
        <Limits />
      </div>
    </>
  )
}

function BlackPod() {
  const send = useMutation({ mutationFn: (file: File) => upload<SeedlingRanking>('/ai/seedlings', 'lab', file) })
  const example = useMutation({
    mutationFn: async () => {
      const csv = await text('/ai/seedlings/example.csv')
      return upload<SeedlingRanking>('/ai/seedlings', 'lab', new File([csv], 'PA-51xICS-95.csv', { type: 'text/csv' }))
    },
  })
  const res = example.data ?? send.data
  const busy = send.isPending || example.isPending
  const err = send.error ?? example.error
  const fromExample = !!example.data && !send.data
  const max = Math.max(...(res?.seedlings.map((x) => x.score) ?? [1]))

  return (
    <Dark glows={[['#7B4DFF', '85% 0%', '120% 160%'], ['#3DDC97', '0% 100%', '80% 100%']]} className="mt-5 grid gap-8 p-7 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="flex flex-col gap-3.5">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-bean/20 px-3 py-1.5 text-[11px] font-extrabold tracking-[0.08em] text-[#CDBBFF]">
          <Sparkles size={13} className="text-[#B9A2FF]" /> MODEL AI · BUSUK BUAH
        </span>
        <h2 className="font-display text-[30px] leading-[1.08] font-bold tracking-[-0.025em]">Semaian mana yang paling tahan busuk buah?</h2>
        <p className="text-[13px] leading-relaxed text-white/65">
          Unggah genotipe semaian dari <b className="text-white">satu silangan</b>. Model mengurutkan semaian dari DNA-nya, sebelum bertahun-tahun di lapang. Simpan
          seperempat teratas untuk uji lapang.
        </p>
        <div className="mt-auto space-y-2">
          <label className={cx('flex cursor-pointer items-center justify-center gap-2 rounded-full bg-bean py-2.5 text-[13px] font-bold text-white', busy && 'opacity-60')}>
            {send.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <FileUp size={15} />} Unggah genotipe semaian
            <input type="file" accept=".csv,.txt" className="sr-only" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) send.mutate(f); e.target.value = '' }} />
          </label>
          <button type="button" disabled={busy} onClick={() => example.mutate()} className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 py-2.5 text-[12.5px] font-bold text-white/85 hover:bg-white/5 disabled:opacity-60">
            {example.isPending && <LoaderCircle size={14} className="animate-spin" />} Pakai contoh data nyata PA-51 × ICS-95
          </button>
          <p className="text-[11px] leading-relaxed text-white/45">Format: baris pertama ID marka lalu ID semaian; isi sel 0/1/2 (salinan alel ALT terhadap Criollo V2).</p>
        </div>
      </div>

      <div className="flex min-h-[320px] flex-col gap-3">
        {err && <Problem what="Ranking semaian" verb="dibuat" error={err} />}
        {!res ? (
          <div className="grid flex-1 place-items-center rounded-2xl border border-dashed border-white/15 p-6 text-center text-[13px] text-white/55">
            Hasil ranking muncul di sini: semaian yang disimpan ditandai ungu, sisanya abu.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <span>
                <span className="block text-[15px] font-bold">
                  {fromExample ? 'PA-51 × ICS-95' : 'Silangan yang diunggah'} · {res.seedlings.length} semaian
                </span>
                <span className="text-xs text-white/50">Skor prediksi · makin pendek makin tahan · bukan persen buah busuk</span>
              </span>
              <span className="flex gap-3.5 text-[11.5px] font-semibold text-white/70">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-[3px] bg-[#9D7BFF]" /> simpan ({res.keep})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-[3px] bg-white/20" /> lepas ({res.seedlings.length - res.keep})
                </span>
              </span>
            </div>
            <div className="flex flex-1 items-end gap-[5px] pt-2">
              {res.seedlings.map((x) => (
                <div
                  key={x.id}
                  title={`#${x.rank} · ${x.id} · skor ${x.score.toFixed(1).replace('.', ',')}`}
                  className={cx('min-w-0 flex-1 rounded-t-[5px] rounded-b-[2px] transition hover:opacity-80', !x.keep && 'bg-white/15')}
                  style={{ height: `${(x.score / max) * 100}%`, background: x.keep ? 'linear-gradient(#B9A2FF, #7B4DFF)' : undefined }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="font-bold text-[#CDBBFF]">
                #1 · {res.seedlings[0].id} · skor {res.seedlings[0].score.toFixed(1).replace('.', ',')}
              </span>
              <span className="text-white/40">
                #{res.seedlings.length} · skor {res.seedlings.at(-1)!.score.toFixed(1).replace('.', ',')}
              </span>
            </div>
            {res.skipped.length > 0 && <p className="text-[11px] text-[#FFC24B]">{res.skipped.length} semaian dilewati: terlalu sedikit marka terbaca ({res.skipped.slice(0, 4).join(', ')}).</p>}
            <p className="text-[11px] leading-relaxed text-white/45">
              {res.note}
              {fromExample && ' Keluarga contoh ini ikut data latih, jadi urutannya lebih optimistis daripada pada silangan baru.'}
            </p>
          </>
        )}
      </div>
    </Dark>
  )
}

function CrossCard() {
  const clones = useQuery({ queryKey: ['clones'], queryFn: () => get<Clone[]>('/clones') })
  const names = (clones.data ?? []).filter((c) => c.status === 'referensi' && c.has_profile).map((c) => c.name)
  const [p, setP] = useState({ parent1: 'TSH1188', parent2: 'SCA6', seed: 1 })
  const run = useMutation({ mutationFn: (seed: number) => post<CrossResult>('/ai/cross', { parent1: p.parent1, parent2: p.parent2, n: 30, seed }) })
  const top = run.data?.seedlings.slice(0, 5) ?? []
  const beans = (t: CrossResult['seedlings'][number]) => t.traits.FR_BEN?.value ?? 0
  const lo = Math.min(...top.map(beans)) - 2
  const hi = Math.max(...top.map(beans))
  const input = 'w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] font-semibold outline-none focus:border-bean'

  return (
    <Card className="flex flex-col gap-3 p-[22px]">
      <div className="flex items-start gap-2.5">
        <IconTile icon={Wheat} size="sm" className="size-9 bg-bean-soft text-bean" />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[17px] leading-snug font-bold tracking-tight">Semaian silangan dengan biji terbanyak</span>
          <span className="text-[11.5px] text-mute">30 semaian disimulasikan dari genotipe kedua tetua, lalu diurutkan menurut prediksi biji per buah</span>
        </span>
        <span className="shrink-0 rounded-full bg-warn-soft px-2.5 py-0.5 text-[10.5px] font-extrabold text-warn">SIMULASI</span>
      </div>
      <datalist id="tetua">
        {names.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <form
        className="grid gap-2 text-[11.5px] font-bold text-body sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          run.mutate(p.seed)
        }}
      >
        <label className="space-y-1">
          Tetua betina
          <input list="tetua" required value={p.parent1} onChange={(e) => setP({ ...p, parent1: e.target.value })} className={input} />
        </label>
        <label className="space-y-1">
          Tetua jantan
          <input list="tetua" required value={p.parent2} onChange={(e) => setP({ ...p, parent2: e.target.value })} className={input} />
        </label>
        <span className="flex gap-2">
          <button type="submit" disabled={run.isPending} className="flex items-center gap-1.5 rounded-full bg-bean px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-60">
            {run.isPending ? <LoaderCircle size={14} className="animate-spin" /> : <Shuffle size={14} />} Buat & ranking
          </button>
          {run.data && (
            <button type="button" title="Acak ulang 30 semaian" onClick={() => { setP({ ...p, seed: p.seed + 1 }); run.mutate(p.seed + 1) }} className="grid size-9 place-items-center rounded-full border border-line hover:bg-cream">
              <Dices size={15} />
            </button>
          )}
        </span>
      </form>
      {run.error && <Problem what="Simulasi silangan" verb="dibuat" error={run.error} />}
      {run.data ? (
        <>
          <ol className="space-y-2.5">
            {top.map((t, i) => (
              <li key={t.name} className="flex items-center gap-2.5 text-[12.5px]">
                <span className="w-6 font-extrabold text-bean">#{i + 1}</span>
                <span className="w-[84px] font-semibold">{t.name}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-bean-soft">
                  <span className="block h-full rounded-full bg-bean" style={{ width: `${((beans(t) - lo) / Math.max(hi - lo, 1)) * 100}%` }} />
                </span>
                <b className="w-24 text-right">
                  {beans(t).toFixed(1).replace('.', ',')} <span className="font-semibold text-mute">± {t.traits.FR_BEN.pm80.toFixed(1).replace('.', ',')}</span>
                </b>
              </li>
            ))}
          </ol>
          <details className="text-[12px]">
            <summary className="cursor-pointer font-bold text-bean">Komponen hasil semaian #1 dan acuan tetua</summary>
            <div className="mt-2 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-[11px] font-extrabold text-mute uppercase">{top[0].name}</p>
                <TraitList traits={top[0].traits} />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold text-mute uppercase">Acuan tetua (model yang sama)</p>
                {run.data.parents.map((x) => (
                  <p key={x.name} className="flex justify-between border-b border-line py-1.5">
                    <span>{x.name}</span>
                    <b>{x.traits ? `${x.traits.FR_BEN.value.toFixed(1).replace('.', ',')} biji/buah` : 'genotipe kurang'}</b>
                  </p>
                ))}
              </div>
            </div>
          </details>
          <p className="border-t border-line pt-2 text-[11.5px] text-mute">Semaian adalah simulasi dari genotipe tetua. Prediksi komponen hasil, bukan hasil panen per hektare.</p>
        </>
      ) : (
        <Empty>Pilih dua tetua dari registri, lalu buat 30 semaian simulasi untuk melihat mana yang diprediksi berbiji terbanyak.</Empty>
      )}
    </Card>
  )
}

const LIMITS: { name: string; ok: string; no: string; warn?: boolean }[] = [
  { name: 'Busuk buah', ok: 'Ranking semaian dalam satu silangan', no: 'Membandingkan klon atau antar-silangan' },
  { name: 'Komponen hasil', ok: 'Biji per buah, ukuran biji, pod index dari genotipe genome-wide', no: 'Hasil panen per hektare; panel 48 SNP' },
  { name: 'Asal-usul', ok: 'Perkiraan komposisi kelompok genetik', no: 'Bukan vonis; kelompok Curaray, Purús, Nacional belum ada', warn: true },
  { name: 'Campuran klon', ok: 'Bukti uji silang + kemiripan DNA sebagai tanda risiko', no: 'Jaminan buah jadi di kebun', warn: true },
  { name: 'Kesesuaian lokasi', ok: 'Lokasi uji dengan iklim mirip dan hasil ujinya', no: 'Janji hasil di kebun petani', warn: true },
]

function Limits() {
  return (
    <Dark className="flex flex-col gap-3 rounded-[22px] p-[22px]">
      <div>
        <h2 className="font-display text-[17px] font-bold">Batas yang kami tulis terang</h2>
        <p className="text-[11.5px] text-white/50">Tiap model dipakai hanya untuk yang lolos uji</p>
      </div>
      {LIMITS.map((m) => (
        <div key={m.name} className="space-y-1.5 rounded-[14px] bg-white/5 p-3">
          <p className="text-[13px] font-bold">{m.name}</p>
          <p className="flex items-start gap-1.5 text-[11.5px] text-white/70">
            <Check size={13} className="mt-px shrink-0 text-mint" /> {m.ok}
          </p>
          <p className="flex items-start gap-1.5 text-[11.5px] text-white/70">
            {m.warn ? <TriangleAlert size={13} className="mt-px shrink-0 text-[#FFC24B]" /> : <X size={13} className="mt-px shrink-0 text-[#FF8F92]" />} {m.no}
          </p>
        </div>
      ))}
    </Dark>
  )
}

function ReflexTab() {
  const current = useCurrentBatch()
  const { batchId } = current
  const qc = useQueryClient()
  const simulated = useSimulated()
  const queue = useQuery({ queryKey: ['reflex', batchId], enabled: !!batchId, queryFn: () => get<ReflexQueue>(`/ai/reflex?batch_id=${batchId}`) })
  const send = useMutation({
    mutationFn: (file: File) => upload<{ updated: string[]; unknown_ids: string[] }>(`/ai/reflex?batch_id=${batchId}`, 'lab', file),
    onSuccess: () => {
      for (const key of [['reflex', batchId], ['sample'], ['audit']]) qc.invalidateQueries({ queryKey: key })
    },
  })
  const save = useMutation({ mutationFn: download })

  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="space-y-4 p-[22px]">
        <CardHead
          title="Uji refleks untuk pohon TIDAK DIKENAL"
          sub="Panel 48 SNP tidak bisa menempatkan pohon ini di registri"
          right={<BatchPicker current={current} />}
        />
        {queue.isError ? (
          <Problem what="Antrean uji refleks" error={queue.error} />
        ) : !queue.data ? (
          <Loading />
        ) : !queue.data.samples.length ? (
          <Empty>Tidak ada pohon TIDAK DIKENAL di batch ini.</Empty>
        ) : (
          queue.data.samples.map((x) => <ReflexRow key={x.sample_id} batchId={batchId!} x={x} />)
        )}
      </Card>
      <Card className="flex flex-col gap-3 p-[22px]">
        <h2 className="font-display text-[17px] font-bold">Unggah genotipe genome-wide</h2>
        <p className="text-[12.5px] leading-relaxed text-body">
          Kirim daun pohon di daftar ini ke lab untuk genotyping genome-wide (±{queue.data?.snps ?? 589} SNP model). Unggah hasilnya dengan format file lab biasa: ID
          sampel lalu satu kolom per SNP. Prediksi komponen hasil dan asal-usul dihitung otomatis dan tercatat di jejak audit.
        </p>
        <label className={cx('flex cursor-pointer items-center justify-center gap-2 rounded-full bg-bean py-2.5 text-[13px] font-bold text-white', (send.isPending || !batchId) && 'opacity-60')}>
          {send.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <FileUp size={15} />} Unggah file genome-wide
          <input type="file" accept=".csv,.txt,.xlsx" className="sr-only" disabled={send.isPending || !batchId} onChange={(e) => { const f = e.target.files?.[0]; if (f) send.mutate(f); e.target.value = '' }} />
        </label>
        {simulated && !!queue.data?.samples.length && (
          <button type="button" onClick={() => save.mutate(`/ai/reflex/example.csv?batch_id=${batchId}`)} className="text-[12.5px] font-bold text-bean hover:underline">
            Unduh contoh file genome-wide untuk batch ini (DATA SIMULASI)
          </button>
        )}
        {send.data && (
          <p className="rounded-xl bg-ok-soft px-3 py-2 text-[12px] text-ok">
            {send.data.updated.length} pohon diperbarui: {send.data.updated.join(', ')}
            {send.data.unknown_ids.length > 0 && ` · ${send.data.unknown_ids.length} ID tidak ada di batch ini`}
          </p>
        )}
        {send.error && <Problem what="File genome-wide" verb="diproses" error={send.error} />}
        {save.error && <Problem what="File contoh" verb="diunduh" error={save.error} />}
      </Card>
    </div>
  )
}

function ReflexRow({ batchId, x }: { batchId: number; x: ReflexQueue['samples'][number] }) {
  const anc = useQuery({
    queryKey: ['ancestry', String(batchId), x.sample_id],
    queryFn: () => get<SampleAncestry>(`/ai/ancestry/sample?batch_id=${batchId}&sample_id=${encodeURIComponent(x.sample_id)}`),
  })
  const par = anc.data?.parentage
  const r = x.refleks
  return (
    <div className="space-y-3 rounded-2xl border border-line p-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <Link to={`/hasil/${batchId}/${encodeURIComponent(x.sample_id)}`} className="font-mono text-[14px] font-bold hover:underline">
          {x.sample_id}
        </Link>
        <VerdictPill v="TIDAK DIKENAL" />
        <span className="text-[12px] text-mute">
          diklaim {x.claim} · {x.provider.replace('KE Simulasi ', 'KE ')}
        </span>
        <span className={cx('ml-auto rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold', r?.traits ? 'bg-ok-soft text-ok' : 'bg-cream text-body')}>
          {r?.traits ? 'SUDAH UJI REFLEKS' : r ? 'GENOTIPE KURANG' : 'MENUNGGU GENOME-WIDE'}
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-[10.5px] font-extrabold tracking-[0.1em] text-mute uppercase">Asal biji · uji Mendel, bukan AI</p>
          <p className="text-[13px] font-bold">{par?.ok ? par.parents.join(' × ') : anc.isPending ? '…' : 'Tidak cocok dengan pasangan klon kebun'}</p>
          {par?.ok && <p className="text-[11.5px] text-body">{par.exclusions} eksklusi dari {par.compared} SNP (wajar ≤ {par.allowed})</p>}
          <p className="pt-1 text-[10.5px] font-extrabold tracking-[0.1em] text-mute uppercase">Latar genetik · perkiraan AI {r?.ancestry ? '(genome-wide)' : '(panel 48 SNP, kasar)'}</p>
          {anc.isError ? <Problem what="Asal-usul" error={anc.error} /> : (r?.ancestry ?? anc.data) && <AncestryBar a={(r?.ancestry ?? anc.data)!} />}
        </div>
        <div>
          <p className="text-[10.5px] font-extrabold tracking-[0.1em] text-mute uppercase">Komponen hasil · prediksi AI</p>
          {r?.traits ? <TraitList traits={r.traits} /> : <p className="mt-1 text-[12.5px] text-body">{r?.message ?? 'Belum ada genotipe genome-wide untuk pohon ini.'}</p>}
        </div>
      </div>
    </div>
  )
}

function GardenTab() {
  const [clones, setClones] = useState<string[]>(['Sulawesi 1', 'MCC 01', 'MCC 02'])
  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <MixCard clones={clones} setClones={setClones} />
      <WhereCard clones={clones} />
    </div>
  )
}

function Section({ icon: Icon, title, sub, children }: { icon: LucideIcon; title: string; sub: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-4 p-[22px]">
      <div className="flex items-start gap-2.5">
        <IconTile icon={Icon} size="sm" className="size-9 bg-bean-soft text-bean" />
        <span>
          <span className="block font-display text-[17px] leading-snug font-bold tracking-tight">{title}</span>
          <span className="text-[11.5px] text-mute">{sub}</span>
        </span>
      </div>
      {children}
    </Card>
  )
}

// Crossing-test results are stored in the source's English wording.
const CROSS_VALUE: Record<string, string> = {
  'specific cross compatible': 'cocok disilangkan dengan klon tertentu',
  'cross compatible': 'cocok disilangkan',
  'cross incompatible': 'tidak cocok disilangkan',
}

function MixCard({ clones, setClones }: { clones: string[]; setClones: (v: string[]) => void }) {
  const options = useQuery({ queryKey: ['mix-options'], queryFn: () => get<{ indonesia: string[]; registry: string[] }>('/ai/mix/options') })
  const names = [...new Set([...(options.data?.indonesia ?? []), ...(options.data?.registry ?? [])])]
  const run = useMutation({ mutationFn: () => post<MixAdvice>('/ai/mix', { clones }) })
  const d = run.data
  return (
    <Section icon={GitFork} title="Penasihat campuran klon" sub="Apakah klon dalam satu blok bisa saling menyerbuki? Kakao banyak yang tidak bisa menyerbuk sendiri.">
      <ClonesInput value={clones} onChange={setClones} names={names} />
      <button type="button" disabled={clones.length < 1 || run.isPending} onClick={() => run.mutate()} className="flex w-fit items-center gap-2 rounded-full bg-bean px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-60">
        {run.isPending && <LoaderCircle size={14} className="animate-spin" />} Periksa campuran
      </button>
      {run.error && <Problem what="Saran campuran" verb="dibuat" error={run.error} />}
      {d && (
        <div className="space-y-3">
          {d.warnings.map((w) => (
            <p key={w} className="flex gap-2 rounded-xl bg-warn-soft px-3 py-2 text-[12px] text-[#7A4A00]">
              <TriangleAlert size={15} className="mt-px shrink-0 text-warn" /> {w}
            </p>
          ))}
          <ul className="divide-y divide-line">
            {d.pairs.map((p) => (
              <li key={`${p.a}${p.b}`} className="space-y-1 py-2.5 text-[12.5px]">
                <p className="font-bold">
                  {p.a} × {p.b}
                </p>
                {p.crosses.length ? (
                  p.crosses.map((c) => (
                    <p key={`${c.female}${c.male}`} className="text-body">
                      {c.female} ♀ × {c.male} ♂: {c.successes} dari {c.attempts} penyerbukan jadi buah (uji silang)
                    </p>
                  ))
                ) : (
                  <p className="text-mute">Belum ada uji silang pasangan ini.</p>
                )}
                <p className="text-body">
                  {p.similarity_percentile == null
                    ? 'Kemiripan DNA: belum bisa dihitung (sidik jari salah satu klon belum ada).'
                    : `Kemiripan DNA lebih tinggi dari ${p.similarity_percentile}% pasangan klon di registri${p.similarity_percentile >= 95 ? ': risiko gagal saling menyerbuki' : ''}.`}
                </p>
              </li>
            ))}
          </ul>
          <ul className="space-y-1 text-[12px]">
            {d.clones.map((c) => (
              <li key={c.clone} className="text-body">
                <b className="text-ink">{c.clone}</b>:{' '}
                {[
                  ...c.facts.map((f) => (f.fact === 'self_pollination' ? `menyerbuk sendiri ${f.value}` : (CROSS_VALUE[f.value] ?? f.value))),
                  c.prediction && `prediksi DNA: ${c.prediction.class}`,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'belum ada data'}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-mute">{d.caveat}</p>
        </div>
      )}
    </Section>
  )
}

function WhereCard({ clones }: { clones: string[] }) {
  const { batch } = useCurrentBatch()
  const gardens = gardenPoints(batch.data?.samples ?? [])
  const [pt, setPt] = useState<{ lat: string; lon: string }>({ lat: '-2.59', lon: '120.33' })
  const [only, setOnly] = useState(true)
  const [gpsMsg, setGpsMsg] = useState('')
  const run = useMutation({
    mutationFn: () => {
      const q = new URLSearchParams({ lat: pt.lat, lon: pt.lon })
      if (only) clones.forEach((c) => q.append('clones', c))
      return get<WhereResult>(`/ai/where?${q}`)
    },
  })
  const d = run.data
  const input = 'w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] font-semibold outline-none focus:border-bean'
  const locate = () =>
    navigator.geolocation?.getCurrentPosition(
      (p) => setPt({ lat: p.coords.latitude.toFixed(4), lon: p.coords.longitude.toFixed(4) }),
      () => setGpsMsg('Lokasi tidak didapat; isi koordinat atau pilih kebun.'),
    )

  return (
    <Section icon={CloudSun} title="Kesesuaian lokasi" sub="Lokasi uji klon dengan iklim paling mirip dengan kebun ini, beserta hasil ujinya">
      <div className="flex flex-wrap gap-1.5">
        {gardens.map((g) => (
          <button key={g.provider} type="button" onClick={() => setPt({ lat: String(g.lat), lon: String(g.lon) })} className="rounded-full border border-line px-3 py-1 text-[11.5px] font-bold hover:bg-cream">
            {g.provider.replace('KE Simulasi ', 'KE ')}
          </button>
        ))}
        <button type="button" onClick={locate} className="flex items-center gap-1 rounded-full border border-line px-3 py-1 text-[11.5px] font-bold hover:bg-cream">
          <LocateFixed size={12} /> Lokasi saya
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11.5px] font-bold text-body">
        <label className="space-y-1">
          Lintang
          <input value={pt.lat} onChange={(e) => setPt({ ...pt, lat: e.target.value })} inputMode="decimal" className={input} />
        </label>
        <label className="space-y-1">
          Bujur
          <input value={pt.lon} onChange={(e) => setPt({ ...pt, lon: e.target.value })} inputMode="decimal" className={input} />
        </label>
      </div>
      {gpsMsg && <p className="text-[11.5px] text-warn">{gpsMsg}</p>}
      <label className="flex items-center gap-2 text-[12px] font-semibold text-body">
        <input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} /> Hanya hasil uji klon di campuran ({clones.join(', ') || '—'})
      </label>
      <button type="button" disabled={run.isPending} onClick={() => run.mutate()} className="flex w-fit items-center gap-2 rounded-full bg-bean px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-60">
        {run.isPending && <LoaderCircle size={14} className="animate-spin" />} Cari lokasi uji yang mirip
      </button>
      {run.error && <Problem what="Data iklim" error={run.error} />}
      {d && (
        <div className="space-y-3">
          <p className="rounded-xl bg-cream px-3 py-2 text-[12px] text-body">
            Titik ini: hujan {d.location.climate.rain_mm.toLocaleString('id-ID')} mm/tahun · {d.location.climate.dry_months} bulan kering · {d.location.climate.temp_c.toFixed(1).replace('.', ',')}°C ·{' '}
            {d.location.climate.elev_m} m dpl
          </p>
          {d.sites.map((s) => (
            <div key={s.site_id} className="space-y-1.5 rounded-2xl border border-line p-3">
              <p className="flex items-center justify-between gap-2 text-[13px] font-bold">
                {s.name}, {s.province}
                <span className="rounded-full bg-bean-soft px-2 py-0.5 text-[10.5px] font-extrabold text-bean">{s.similarity}</span>
              </p>
              {s.evidence.length ? (
                s.evidence.slice(0, 5).map((e, i) => (
                  <p key={i} className="flex justify-between gap-3 text-[12px] text-body">
                    <span>
                      {e.clone} · {e.label}
                    </span>
                    <b className="text-right whitespace-nowrap">
                      {/^-?\d+(\.\d+)?$/.test(e.value) ? Number(e.value).toLocaleString('id-ID') : e.value} {e.year && <span className="font-semibold text-mute">· {e.year}</span>}
                    </b>
                  </p>
                ))
              ) : (
                <p className="text-[12px] text-mute">Belum ada hasil uji klon terpilih di lokasi ini.</p>
              )}
            </div>
          ))}
          <p className="text-[11px] text-mute">{d.caveat}</p>
        </div>
      )}
    </Section>
  )
}
