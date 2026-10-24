import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, get, isOffline, post } from './api'

const reply = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status }))

afterEach(() => vi.unstubAllGlobals())

describe('klien API', () => {
  it('mengirim header X-Role Pengawas benih ke /api', async () => {
    const fetch = vi.fn(() => reply(200, []))
    vi.stubGlobal('fetch', fetch)

    await get('/batches')

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/batches')
    expect(new Headers(init.headers).get('X-Role')).toBe('Pengawas benih')
  })

  it('mengirim body sebagai JSON', async () => {
    const fetch = vi.fn(() => reply(201, { ok: true }))
    vi.stubGlobal('fetch', fetch)

    await post('/batches/1/samples', { sample_id: 'LUW-001' })

    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.method).toBe('POST')
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json')
    expect(JSON.parse(init.body as string)).toEqual({ sample_id: 'LUW-001' })
  })

  it('gagal dengan pesan detail dari API', async () => {
    vi.stubGlobal('fetch', () => reply(409, { detail: 'ID LUW-001 sudah dipakai di batch ini.' }))

    const err = (await get('/x').catch((e: unknown) => e)) as ApiError

    expect(err).toBeInstanceOf(ApiError)
    expect(err.message).toBe('ID LUW-001 sudah dipakai di batch ini.')
    expect(err.status).toBe(409)
  })

  it('merangkum error validasi FastAPI menjadi pesan yang terbaca', async () => {
    vi.stubGlobal('fetch', () =>
      reply(422, { detail: [{ loc: ['body', 'sample_id'], msg: 'String should match pattern' }] }),
    )

    const err = (await get('/x').catch((e: unknown) => e)) as ApiError

    expect(err.message).toBe('sample_id: String should match pattern')
  })

  it('memberi pesan umum bila API tidak mengirim detail', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('Internal error', { status: 500 })))

    const err = (await get('/x').catch((e: unknown) => e)) as ApiError

    expect(err.message).toBe('Permintaan ditolak (HTTP 500)')
  })

  it('gangguan jaringan dikenali sebagai offline, bukan penolakan server', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')))

    const err = (await get('/x').catch((e: unknown) => e)) as ApiError

    expect(isOffline(err)).toBe(true)
    expect(isOffline(new ApiError('ditolak', 409))).toBe(false)
  })
})
