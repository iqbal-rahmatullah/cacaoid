import { describe, expect, it } from 'vitest'
import { ApiError } from './api'
import { flushQueue, loadQueue, submitSample, type Pending } from './queue'

function memoryStore(initial?: string) {
  const data = new Map<string, string>(initial ? [['lap.queue', initial]] : [])
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) }
}
const sample = (id: string): Pending => ({ batchId: 1, body: { sample_id: id, claim: 'MCC 01' } })
const offline = () => Promise.reject(new TypeError('Failed to fetch'))

describe('submitSample', () => {
  it('mengirim langsung saat online dan tidak mengantre', async () => {
    const store = memoryStore()

    const how = await submitSample(store, () => Promise.resolve({}), sample('LUW-001'))

    expect(how).toBe('terkirim')
    expect(loadQueue(store)).toEqual([])
  })

  it('menyimpan sampel di perangkat saat tidak ada sinyal', async () => {
    const store = memoryStore()

    const how = await submitSample(store, offline, sample('LUW-001'))

    expect(how).toBe('antre')
    expect(loadQueue(store).map((p) => p.body.sample_id)).toEqual(['LUW-001'])
  })

  it('tidak mengantre sampel yang ditolak server, tetapi melempar pesannya', async () => {
    const store = memoryStore()
    const reject = () => Promise.reject(new ApiError('ID LUW-001 sudah dipakai di batch ini.', 409))

    await expect(submitSample(store, reject, sample('LUW-001'))).rejects.toThrow('sudah dipakai')
    expect(loadQueue(store)).toEqual([])
  })

  it('tidak diam-diam kehilangan sampel bila perangkat tidak bisa menyimpan', async () => {
    await expect(submitSample(null, offline, sample('LUW-001'))).rejects.toThrow('tidak bisa menyimpan')
  })
})

describe('flushQueue', () => {
  it('mengirim antrean sesuai urutan lalu mengosongkannya', async () => {
    const store = memoryStore(JSON.stringify([sample('A'), sample('B')]))
    const sent: string[] = []

    const out = await flushQueue(store, async (p) => void sent.push(p.body.sample_id))

    expect(sent).toEqual(['A', 'B'])
    expect(out).toEqual({ sent: ['A', 'B'], rejected: [], left: 0 })
    expect(loadQueue(store)).toEqual([])
  })

  it('berhenti saat sinyal hilang dan menyimpan sisa antrean', async () => {
    const store = memoryStore(JSON.stringify([sample('A'), sample('B'), sample('C')]))
    let calls = 0

    const out = await flushQueue(store, () => (++calls === 2 ? offline() : Promise.resolve({})))

    expect(out.sent).toEqual(['A'])
    expect(out.left).toBe(2)
    expect(loadQueue(store).map((p) => p.body.sample_id)).toEqual(['B', 'C'])
  })

  it('membuang sampel yang ditolak server, melaporkannya, lalu lanjut', async () => {
    const store = memoryStore(JSON.stringify([sample('A'), sample('B')]))
    const send = (p: Pending) =>
      p.body.sample_id === 'A' ? Promise.reject(new ApiError('ID A sudah dipakai di batch ini.', 409)) : Promise.resolve({})

    const out = await flushQueue(store, send)

    expect(out.rejected).toEqual([{ sampleId: 'A', message: 'ID A sudah dipakai di batch ini.' }])
    expect(out.sent).toEqual(['B'])
    expect(loadQueue(store)).toEqual([])
  })

  it('dua sinkron bersamaan tidak mengirim sampel yang sama dua kali', async () => {
    const store = memoryStore(JSON.stringify([sample('A'), sample('B')]))
    const sent: string[] = []
    const send = async (p: Pending) => {
      await new Promise((r) => setTimeout(r, 5))
      sent.push(p.body.sample_id)
    }

    await Promise.all([flushQueue(store, send), flushQueue(store, send)])

    expect(sent).toEqual(['A', 'B'])
  })

  it('isi penyimpanan yang rusak dianggap antrean kosong', () => {
    expect(loadQueue(memoryStore('{bukan json'))).toEqual([])
  })
})
