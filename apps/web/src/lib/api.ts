// Client for apps/api (Vite proxies /api to :8001). One role for now, sent as X-Role for the audit trail.
import type { Verdict } from '../data/demo'

export const ROLE = 'Pengawas benih'

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

export async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('X-Role', ROLE)
  if (typeof init.body === 'string') headers.set('Content-Type', 'application/json')
  const r = await fetch(`/api${path}`, { ...init, headers })
  const body = await r.json().catch(() => null)
  if (!r.ok) throw new ApiError(message(body, r.status), r.status)
  return body as T
}

export const get = <T,>(path: string) => req<T>(path)
export const post = <T,>(path: string, data: unknown) => req<T>(path, { method: 'POST', body: JSON.stringify(data) })

export type Clone = { name: string; kind: string; status: string; source: string }
export type Provider = { id: number; name: string; province: string; regency: string; clones: string[] }
export type Risk = { provider: string; score: number; tier: string; recommended_n: number; n: number; bad: number }
export type BatchSummary = { id: number; name: string; created_at: string; analyzed_at: string | null; n_samples: number }
export type SampleRow = {
  sample_id: string; is_control: boolean; claim: string; kind: string; lot: string; provider: string
  province: string; regency: string; lat: number | null; lon: number | null; date: string; officer: string
  call_rate: number | null; verdict: Verdict | null; found_as: string | null; action: string | null
}
export type Batch = BatchSummary & { samples: SampleRow[] }
export type Step = { title: string; detail: string; ok: boolean | null }
export type SampleDetail = SampleRow & {
  batch_name: string
  result: { mismatches?: number | null; compared?: number | null; allowed?: number | null; steps?: Step[]; notes?: string[] }
}
export type TraitRow = { label: string; paid: number; received: number; pct: number | null; worse: boolean | null; site: string; year: string; source: string }
export type Compare = { same_trial: TraitRow[] }
