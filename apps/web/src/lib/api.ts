// Client for apps/api (Vite proxies /api to :8001). One role for now, sent as X-Role for the audit trail.
export const ROLE = 'Pengawas benih'

export type Verdict =
  | 'COCOK'
  | 'SESUAI SILANGAN'
  | 'KONTAMINAN'
  | 'OFF-TYPE'
  | 'BELUM ADA REFERENSI'
  | 'UJI ULANG'
  | 'TIDAK DIKENAL'
  | 'BATANG BAWAH'
  | 'TAHAN'

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

// fetch rejects with TypeError when there is no network; the field app queues the sample instead (GAPS G-12).
export const isOffline = (e: unknown) => e instanceof TypeError

function message(body: unknown, status: number) {
  const detail = (body as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) // FastAPI validation errors
    return detail.map((d: { loc?: unknown[]; msg?: string }) => `${d.loc?.at(-1) ?? ''}: ${d.msg ?? ''}`).join('; ')
  return `Permintaan ditolak (HTTP ${status})`
}

async function call(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('X-Role', ROLE)
  if (typeof init.body === 'string') headers.set('Content-Type', 'application/json')
  const r = await fetch(`/api${path}`, { ...init, headers })
  if (!r.ok) throw new ApiError(message(await r.json().catch(() => null), r.status), r.status)
  return r
}

export async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  return (await call(path, init)).json().catch(() => null) as Promise<T>
}

export const get = <T,>(path: string) => req<T>(path)
export const post = <T,>(path: string, data: unknown) => req<T>(path, { method: 'POST', body: JSON.stringify(data) })
export const put = <T,>(path: string, data: unknown) => req<T>(path, { method: 'PUT', body: JSON.stringify(data) })
export const text = async (path: string) => (await call(path)).text()

export function upload<T>(path: string, field: string, file: File) {
  const body = new FormData()
  body.append(field, file)
  return req<T>(path, { method: 'POST', body })
}

// Through fetch, not a plain link, so a refusal (e.g. no GPS points yet) shows as a message instead of a saved error page.
export async function download(path: string) {
  const r = await call(path)
  const name = /filename="([^"]+)"/.exec(r.headers.get('Content-Disposition') ?? '')?.[1] ?? path.split('/').pop()!
  const url = URL.createObjectURL(await r.blob())
  Object.assign(document.createElement('a'), { href: url, download: name }).click()
  URL.revokeObjectURL(url)
}

export type Clone = {
  name: string; kind: string; status: string; source: string; group?: string | null; n_trees?: number
  parent1?: string | null; parent2?: string | null; has_profile?: boolean
}
export type CloneDetail = Clone & { panel: { snp: string; call: string | null }[] }
export type Fact = { value: string; unit: string; site: string; year: string; source: string; where: string; flag: string | null; note: string }
export type TraitCard = { clone: string; canonical: string | null; traits: { trait: string; label: string; facts: Fact[] }[] }
export type Provider = { id: number; name: string; kind: string; province: string; regency: string; clones: string[]; source: string }
export type Risk = {
  provider: string; province: string; regency: string; score: number; tier: string; recommended_n: number; n: number; bad: number
  factors: { label: string; points: number }[]
}

export type Lot = {
  lot: string; claim: string; n: number; decision: string; message?: string
  parents?: [string, string]; excluded?: number; estimate?: number; ci?: [number, number]; alpha?: number
}
export type ControlResult = { id: string; ok: boolean; message: string }
// Empty until the lab file is uploaded; control_results, lots and plate_shift appear after the analysis.
export type BatchQc = {
  n_samples?: number; mean_call_rate?: number; min_call_rate?: number; retest?: string[]; unknown_ids?: string[]
  missing_ids?: string[]; snps_not_in_panel?: string[]; panel_snps_missing?: string[]; panel_used?: string[]
  strand_fixed?: Record<string, number>; id_mapped?: string[]; controls?: string[]; warnings?: string[]
  control_results?: ControlResult[]; lots?: Lot[]; plate_shift?: { direction: number; samples: string[]; message: string } | null
}
export type BatchSummary = {
  id: number; name: string; created_at: string; analyzed_at: string | null; lab_file: string | null
  n_samples: number; n_with_lab: number; counts: Partial<Record<Verdict, number>>; qc: BatchQc
}
export type SampleRow = {
  sample_id: string; is_control: boolean; claim: string; kind: string; lot: string; provider: string
  province: string; regency: string; lat: number | null; lon: number | null; date: string; officer: string; position: string
  lab_row: number | null; call_rate: number | null; verdict: Verdict | null; found_as: string | null; action: string | null; lod: number | null
}
export type Batch = BatchSummary & { samples: SampleRow[] }
export type Step = { title: string; detail: string; ok: boolean | null }
export type CompareRow = { snp: string; sample: string | null; claimed: string | null; found: string | null }
export type Parentage = { parents: [string, string]; exclusions: number; compared: number; allowed: number; lod: number; ok: boolean }
export type SampleDetail = SampleRow & {
  batch_name: string
  result: {
    mismatches?: number | null; compared?: number | null; allowed?: number | null; steps?: Step[]; notes?: string[]
    compare?: CompareRow[]; candidates?: { name: string; mismatches: number; compared: number }[]; parentage?: Parentage
  }
}
export type TraitRow = {
  label: string; paid: number; received: number; unit: string; pct: number | null; worse: boolean | null; site: string; year: string; source: string
}
export type Compare = { same_trial: TraitRow[] }

export type Dashboard = {
  samples: number; verified: number; ok: number; verified_ok_rate: number | null; bad: number; awaiting_lab: number
  retest: number; no_reference: number; lots_held: number; purification: number; batches: number
  verdicts: Partial<Record<Verdict, number>>; lab_received: number; qc_passed: number; follow_up: number; follow_up_done: number
  by_province: Rate[]; by_provider: Rate[]; by_kind: Rate[]
}
export type Rate = { name: string; bad: number; n: number; rate: number }

export type AuditEvent = {
  id: number; ts: string; actor: string; action: string; batch_id: number | null; sample_id: string | null
  payload: Record<string, unknown>; hash: string
}
export type Audit = { chain: { ok: boolean; events: number; head?: string; broken_at?: number }; events: AuditEvent[] }
export type Passport = {
  identity: { verdict: Verdict | null; claim: string; verified: boolean; found_as: string | null }
  plot: { type: 'Point'; coordinates: [number, number] } | null
  eudr: { verdict: string; reasons: string[]; caveats: string[] } | null
  message?: string
}
export type SearchResult = {
  samples: { batch_id: number; sample_id: string; claim: string; kind: string; verdict: Verdict | null }[]
  clones: { name: string; status: string }[]
  providers: { id: number; name: string; regency: string; province: string }[]
}
