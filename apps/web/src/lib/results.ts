// Batch-result helpers the web pages share: Indonesian number/date format, lab checks, plate map,
// fingerprint cells, paging, follow-up list and the partner recap. Pure functions, tested in results.test.ts.
import type { Cell } from '../components/ui'
import type { BatchQc, BatchSummary, CompareRow, Lot, SampleRow, Verdict } from './api'

export const OK = new Set<Verdict>(['COCOK', 'SESUAI SILANGAN'])
export const BAD = new Set<Verdict>(['OFF-TYPE', 'TIDAK DIKENAL', 'BATANG BAWAH', 'KONTAMINAN'])

export const pct = (r: number, digits = 1) => `${(r * 100).toFixed(digits).replace('.', ',')}%`
export const num = (n: number) => n.toLocaleString('id-ID')

// Officers work in Sulawesi, so dates and times read in WITA whatever the viewer's machine says.
const fmt = (opts: Intl.DateTimeFormatOptions) => (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Makassar', ...opts }).format(new Date(iso)) : '—'
export const shortDate = fmt({ day: 'numeric', month: 'short' })
export const longDate = fmt({ day: 'numeric', month: 'long', year: 'numeric' })
export const clock = fmt({ hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })

export type Check = { tone: 'ok' | 'warn' | 'bad' | 'info'; label: string; value: string }

// What the lab upload and the analysis found, as one list for the Unggah and Hasil pages.
export function labChecks(qc: BatchQc): Check[] {
  if (qc.n_samples == null) return []
  const unknown = qc.unknown_ids?.length ?? 0
  const missing = qc.missing_ids?.length ?? 0
  const used = qc.panel_used?.length ?? 0
  const gap = qc.panel_snps_missing?.length ?? 0
  const flipped = Object.keys(qc.strand_fixed ?? {}).length
  const retest = (qc.retest ?? []).filter((id) => !id.startsWith('KTRL-NTC')).length // an empty NTC is the point
  const outside = qc.snps_not_in_panel?.length ?? 0
  const pos = qc.controls?.find((c) => c.startsWith('KTRL-POS-'))
  const ntc = qc.controls?.find((c) => c.startsWith('KTRL-NTC'))
  const result = (id?: string) => qc.control_results?.find((c) => c.id === id)
  const shift = qc.plate_shift
  const checks: (Check | false)[] = [
    { tone: unknown || missing ? 'warn' : 'ok', label: 'ID sampel cocok data lapangan', value: `${qc.n_samples - unknown}/${qc.n_samples}` },
    missing > 0 && { tone: 'warn', label: 'Belum ada di file lab', value: `${missing} sampel` },
    { tone: gap ? 'warn' : 'ok', label: 'SNP panel terkirim', value: `${used}/${used + gap}` },
    { tone: 'ok', label: 'DNA terbaca rata-rata', value: pct(qc.mean_call_rate ?? 0) },
    { tone: flipped ? 'warn' : 'ok', label: 'Untai DNA terbalik', value: `${flipped} dikoreksi` },
    shift === undefined
      ? { tone: 'info', label: 'Pergeseran sumur plate', value: 'dicek saat verifikasi' }
      : shift
        ? { tone: 'bad', label: 'Pergeseran sumur plate', value: `${shift.samples.length} sampel` }
        : { tone: 'ok', label: 'Pergeseran sumur plate', value: 'tidak ada' },
    !pos && !ntc && { tone: 'bad', label: 'Kontrol plate', value: 'tidak ada' },
    !!pos && control(`Kontrol positif ${pos.slice('KTRL-POS-'.length)}`, result(pos)?.ok, 'COCOK', 'tidak cocok'),
    !!ntc && control('Kontrol negatif', result(ntc)?.ok, 'bersih', 'ada DNA'),
    { tone: retest ? 'warn' : 'ok', label: `DNA terbaca < ${pct(qc.min_call_rate ?? 0.85, 0)}`, value: retest ? `${retest} → uji ulang` : '0' },
    outside > 0 && { tone: 'info', label: 'SNP lab di luar panel', value: `${outside} diabaikan` },
  ]
  return checks.filter((c): c is Check => !!c)
}

const control = (label: string, ok: boolean | undefined, pass: string, fail: string): Check =>
  ok === undefined ? { tone: 'info', label, value: 'dinilai saat verifikasi' } : { tone: ok ? 'ok' : 'bad', label, value: ok ? pass : fail }

export type WellState = 'hi' | 'mid' | 'low' | 'fail' | 'pos' | 'ntc' | 'wait' | 'empty'
export type Plate = { plate: number; wells: { well: string; id: string; state: WellState }[] }
// Plates are pipetted down the columns: A1, B1 … H1, A2.
const WELLS = Array.from({ length: 96 }, (_, i) => `${'ABCDEFGH'[i % 8]}${Math.floor(i / 8) + 1}`)

// Plate positions come from the manifest the lab received; DNA read per sample from the lab results.
export function plateWells(manifest: string, samples: SampleRow[], min = 0.85): Plate[] {
  const rate = new Map(samples.map((s) => [s.sample_id, s.call_rate]))
  const plates = new Map<number, Map<string, string>>()
  for (const line of manifest.trim().split(/\r?\n/).slice(1)) {
    const [plate, well, id] = line.split(',')
    if (id) plates.set(+plate, (plates.get(+plate) ?? new Map()).set(well, id))
  }
  return [...plates].map(([plate, wells]) => ({
    plate,
    wells: WELLS.map((well) => {
      const id = wells.get(well) ?? ''
      return { well, id, state: wellState(id, rate.get(id), min) }
    }),
  }))
}

function wellState(id: string, r: number | null | undefined, min: number): WellState {
  if (!id) return 'empty'
  if (id.startsWith('KTRL-POS')) return 'pos'
  if (id.startsWith('KTRL-NTC')) return 'ntc'
  if (r == null) return 'wait'
  return r < min ? 'fail' : r < 0.9 ? 'low' : r < 0.95 ? 'mid' : 'hi'
}

// Genotype strings ("AC") to fingerprint cells: per SNP, homozygous for the first allele = 0, heterozygous = 1,
// homozygous for the other = 2. Claimed/found cells that differ from the sample turn red.
export function toCells(rows: CompareRow[]) {
  const out = { sample: [] as Cell[], claimed: [] as Cell[], found: [] as Cell[] }
  for (const r of rows) {
    const first = [r.sample, r.claimed, r.found].join('').split('').sort()[0]
    const cls = (g: string | null): Cell => (!g ? 'miss' : g[0] !== g[1] ? 1 : g[0] === first ? 0 : 2)
    out.sample.push(cls(r.sample))
    for (const k of ['claimed', 'found'] as const) out[k].push(r[k] && r.sample && r[k] !== r.sample ? 'diff' : cls(r[k]))
  }
  return out
}

export function paginate<T>(rows: T[], page: number, size: number) {
  const pages = Math.max(1, Math.ceil(rows.length / size))
  const p = page >= 1 && page <= pages ? page : 1
  return { rows: rows.slice((p - 1) * size, p * size), pages, page: p }
}

// 1 2 3 … 13: first, last, and the pages next to the current one.
export function pageList(page: number, pages: number): (number | '…')[] {
  const keep = new Set([1, pages, page - 1, page, page + 1, page === 1 ? 3 : 1, page === pages ? pages - 2 : 1])
  const nums = [...keep].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b)
  return nums.flatMap((n, i) => (i && n - nums[i - 1] === 2 ? [n - 1, n] : i && n - nums[i - 1] > 2 ? (['…', n] as const) : [n]))
}

export type FollowUp = { id: string; v: Verdict; text: string; sample?: SampleRow }
const URGENCY: Verdict[] = ['OFF-TYPE', 'TAHAN', 'KONTAMINAN', 'BATANG BAWAH', 'TIDAK DIKENAL', 'UJI ULANG', 'BELUM ADA REFERENSI']

// Everything that needs the officer, biggest impact first, already-handled ones last within a verdict.
// Contaminant seedlings of a held lot are one lot item.
export function followUps(samples: SampleRow[], lots: Lot[] = []): FollowUp[] {
  const held = lots.filter((l) => l.decision === 'TAHAN')
  const heldIds = new Set(held.map((l) => l.lot))
  const items: FollowUp[] = held.map((l) => ({
    id: l.lot,
    v: 'TAHAN',
    text: `${l.excluded} dari ${l.n} bibit bukan ${l.parents?.join(' × ') ?? l.claim} · lot ditahan`,
  }))
  for (const s of samples) {
    if (s.is_control || !s.verdict || !URGENCY.includes(s.verdict)) continue
    if (s.verdict === 'KONTAMINAN' && heldIds.has(s.lot)) continue
    items.push({ id: s.sample_id, v: s.verdict, text: describe(s), sample: s })
  }
  const date = (i: FollowUp) => i.sample?.date ?? ''
  const done = (i: FollowUp) => (i.sample?.action ? 1 : 0)
  return items.sort((a, b) => URGENCY.indexOf(a.v) - URGENCY.indexOf(b.v) || done(a) - done(b) || date(b).localeCompare(date(a)))
}

// Dashboard preview: the first item of each verdict, then the rest, so six off-types do not hide a held lot.
export function spread(items: FollowUp[], n: number) {
  const firsts = items.filter((i, k) => items.findIndex((j) => j.v === i.v) === k)
  return [...firsts, ...items.filter((i) => !firsts.includes(i))].slice(0, n)
}

function describe(s: SampleRow): string {
  switch (s.verdict) {
    case 'OFF-TYPE':
      return `Label ${s.claim}, DNA ${s.found_as ? `cocok ${s.found_as}` : `bukan ${s.claim}`} · ${s.kind}`
    case 'KONTAMINAN':
      return `Bukan anak silangan ${s.claim} · ${s.lot || 'tanpa lot'}`
    case 'BATANG BAWAH':
      return `Tunas batang bawah mengambil alih batang atas ${s.claim}`
    case 'TIDAK DIKENAL':
      return `Diklaim ${s.claim}, tidak cocok dengan klon terdaftar`
    case 'UJI ULANG':
      return `DNA terbaca ${s.call_rate == null ? '—' : pct(s.call_rate, 0)} · ambil daun ulang`
    default:
      return `${s.claim} belum punya sidik jari referensi`
  }
}

// Partner report: per garden and per seed lot, from the same data as the berita acara.
export function recap(samples: SampleRow[], lots: Lot[] = []) {
  const by = new Map<string, { name: string; n: number; verified: number; ok: number; bad: number; rate: number }>()
  for (const s of samples) {
    if (s.is_control) continue
    const g = by.get(s.provider) ?? { name: s.provider || '—', n: 0, verified: 0, ok: 0, bad: 0, rate: 0 }
    g.n++
    if (s.verdict && (OK.has(s.verdict) || BAD.has(s.verdict))) {
      g.verified++
      if (OK.has(s.verdict)) g.ok++
      else g.bad++
    }
    by.set(s.provider, g)
  }
  return {
    gardens: [...by.values()].map((g) => ({ ...g, rate: g.verified ? g.bad / g.verified : 0 })).sort((a, b) => a.name.localeCompare(b.name)),
    lots,
  }
}

// Lab results that arrived after the officer last opened the notifications (null = never opened).
export const unseenBatches = (batches: BatchSummary[], seenAt: string | null) =>
  batches.filter((b) => b.analyzed_at && (!seenAt || new Date(b.analyzed_at) > new Date(seenAt)))

// "Tambah klon" form: one SNP per line ("TcSNP619 A:C", "TcSNP619,AC", tab or "=" also work). The API normalises calls.
export function parseProfile(raw: string) {
  const profile: Record<string, string> = {}
  const bad: string[] = []
  for (const line of raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
    const m = /^(\S+?)[\s,;=]+(\S+)$/.exec(line)
    if (m) profile[m[1]] = m[2]
    else bad.push(line)
  }
  return { profile, bad }
}

// Where a garden is, for the location advisor: the mean GPS point of its samples (no garden polygons yet, G-29).
export function gardenPoints(samples: SampleRow[]) {
  const by = new Map<string, { lat: number; lon: number; n: number }>()
  for (const s of samples) {
    if (s.is_control || s.lat == null || s.lon == null || !s.provider) continue
    const g = by.get(s.provider) ?? { lat: 0, lon: 0, n: 0 }
    by.set(s.provider, { lat: g.lat + s.lat, lon: g.lon + s.lon, n: g.n + 1 })
  }
  const r4 = (x: number) => Math.round(x * 1e4) / 1e4
  return [...by].map(([provider, g]) => ({ provider, lat: r4(g.lat / g.n), lon: r4(g.lon / g.n), n: g.n }))
}
