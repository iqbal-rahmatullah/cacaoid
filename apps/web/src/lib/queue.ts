// GAPS G-12: gardens often have no signal, so unsent samples wait on the device and go out when back online.
import { isOffline } from './api'

export type Pending = { batchId: number; body: { sample_id: string } & Record<string, unknown> }
export type Store = { getItem(k: string): string | null; setItem(k: string, v: string): void }
type Send = (p: Pending) => Promise<unknown>

const KEY = 'lap.queue'

// localStorage can throw (private mode, blocked site data); callers then get null and must not pretend to queue.
export function deviceStore(): Store | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function loadQueue(store: Store | null): Pending[] {
  try {
    const q = JSON.parse(store?.getItem(KEY) ?? '[]')
    return Array.isArray(q) ? q : []
  } catch {
    return []
  }
}

function saveQueue(store: Store, q: Pending[]) {
  store.setItem(KEY, JSON.stringify(q))
}

export async function submitSample(store: Store | null, send: Send, p: Pending): Promise<'terkirim' | 'antre'> {
  try {
    await send(p)
    return 'terkirim'
  } catch (e) {
    if (!isOffline(e)) throw e
    if (!store) throw new Error('Tidak ada sinyal dan perangkat tidak bisa menyimpan sampel. Coba lagi saat ada sinyal.')
    saveQueue(store, [...loadQueue(store), p])
    return 'antre'
  }
}

export type FlushResult = { sent: string[]; rejected: { sampleId: string; message: string }[]; left: number }
let running: Promise<FlushResult> | null = null

// One sync at a time: the 'online' event and a page mount can fire together.
export function flushQueue(store: Store | null, send: Send): Promise<FlushResult> {
  running ??= flush(store, send).finally(() => (running = null))
  return running
}

async function flush(store: Store | null, send: Send): Promise<FlushResult> {
  const out: FlushResult = { sent: [], rejected: [], left: 0 }
  if (!store) return out
  let q = loadQueue(store)
  while (q.length) {
    const p = q[0]
    try {
      await send(p)
      out.sent.push(p.body.sample_id)
    } catch (e) {
      if (isOffline(e)) break
      out.rejected.push({ sampleId: p.body.sample_id, message: (e as Error).message }) // dropped, but reported
    }
    q = q.slice(1)
    saveQueue(store, q)
  }
  out.left = q.length
  return out
}
