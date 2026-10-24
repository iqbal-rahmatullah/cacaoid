import { describe, expect, it } from 'vitest'
import type { BatchQc, BatchSummary, Lot, SampleRow } from './api'
import { followUps, labChecks, spread, longDate, pageList, paginate, parseProfile, pct, plateWells, recap, shortDate, toCells, unseenBatches } from './results'

const row = (sample_id: string, over: Partial<SampleRow> = {}): SampleRow => ({
  sample_id, is_control: false, claim: 'ICS60', kind: 'pohon induk entres', lot: '', provider: 'KE Simulasi Luwu Utara',
  province: 'Sulawesi Selatan', regency: 'Luwu Utara', lat: null, lon: null, date: '2026-10-06', officer: '', position: '',
  lab_row: null, call_rate: 0.95, verdict: 'COCOK', found_as: null, action: null, lod: null, ...over,
})

describe('format angka dan tanggal Indonesia', () => {
  it('memakai koma desimal', () => {
    expect(pct(0.829)).toBe('82,9%')
    expect(pct(0.16, 0)).toBe('16%')
  })

  it('menulis tanggal pendek dan panjang', () => {
    expect(shortDate('2026-10-06')).toBe('6 Okt')
    expect(longDate('2026-10-24T15:56:16+00:00')).toBe('24 Oktober 2026')
    expect(shortDate('')).toBe('—')
  })
})

describe('labChecks', () => {
  const uploaded: BatchQc = {
    n_samples: 137, mean_call_rate: 0.935, retest: ['SIM-008', 'SIM-034', 'KTRL-NTC'], unknown_ids: [], missing_ids: [],
    snps_not_in_panel: ['TcLAB_x01', 'TcLAB_x02'], panel_snps_missing: [], panel_used: Array(48).fill('snp'),
    strand_fixed: {}, controls: ['KTRL-POS-ICS60', 'KTRL-NTC'], warnings: [],
  }

  it('merangkum hasil unggah sebelum verifikasi', () => {
    const c = Object.fromEntries(labChecks(uploaded).map((x) => [x.label, x]))
    expect(c['ID sampel cocok data lapangan']).toMatchObject({ tone: 'ok', value: '137/137' })
    expect(c['SNP panel terkirim']).toMatchObject({ tone: 'ok', value: '48/48' })
    expect(c['DNA terbaca < 85%']).toMatchObject({ tone: 'warn', value: '2 → uji ulang' }) // NTC is meant to be empty
    expect(c['SNP lab di luar panel']).toMatchObject({ tone: 'info', value: '2 diabaikan' })
    expect(c['Pergeseran sumur plate']).toMatchObject({ tone: 'info', value: 'dicek saat verifikasi' })
  })

  it('memakai hasil kontrol dan pergeseran plate setelah verifikasi', () => {
    const qc: BatchQc = {
      ...uploaded,
      control_results: [{ id: 'KTRL-POS-ICS60', ok: true, message: '' }, { id: 'KTRL-NTC', ok: false, message: '' }],
      plate_shift: { direction: 1, samples: ['A', 'B', 'C'], message: '' },
    }
    const c = Object.fromEntries(labChecks(qc).map((x) => [x.label, x]))
    expect(c['Kontrol positif ICS60']).toMatchObject({ tone: 'ok', value: 'COCOK' })
    expect(c['Kontrol negatif']).toMatchObject({ tone: 'bad', value: 'ada DNA' })
    expect(c['Pergeseran sumur plate']).toMatchObject({ tone: 'bad', value: '3 sampel' })
  })

  it('kosong sebelum file lab diunggah', () => {
    expect(labChecks({})).toEqual([])
  })
})

describe('plateWells', () => {
  const manifest = 'plate,well,sample_id\n1,A1,SIM-001\n1,B1,SIM-002\n1,C1,SIM-003\n1,D1,KTRL-POS-ICS60\n1,E1,KTRL-NTC\n'

  it('memetakan DNA terbaca ke sumur, kolom demi kolom', () => {
    const samples = [row('SIM-001', { call_rate: 0.97 }), row('SIM-002', { call_rate: 0.52 }), row('SIM-003', { call_rate: null })]
    const [plate] = plateWells(manifest, samples)
    expect(plate.wells).toHaveLength(96)
    expect(plate.wells.slice(0, 6).map((w) => [w.well, w.state])).toEqual([
      ['A1', 'hi'], ['B1', 'fail'], ['C1', 'wait'], ['D1', 'pos'], ['E1', 'ntc'], ['F1', 'empty'],
    ])
    expect(plate.wells[8].well).toBe('A2')
  })

  it('memisahkan plate', () => {
    expect(plateWells(manifest + '2,A1,SIM-095\n', []).map((p) => p.plate)).toEqual([1, 2])
  })
})

describe('toCells', () => {
  it('memberi kelas genotipe per SNP dan menandai beda dari sampel', () => {
    const rows = toCells([
      { snp: 's1', sample: 'AC', claimed: 'AA', found: 'AC' },
      { snp: 's2', sample: 'CC', claimed: null, found: 'CC' },
      { snp: 's3', sample: null, claimed: 'GG', found: 'GG' },
    ])
    expect(rows.sample).toEqual([1, 0, 'miss'])
    expect(rows.claimed).toEqual(['diff', 'miss', 0])
    expect(rows.found).toEqual([1, 0, 0])
  })
})

describe('paginasi', () => {
  it('memotong baris per halaman', () => {
    const p = paginate([1, 2, 3, 4, 5], 2, 2)
    expect(p).toEqual({ rows: [3, 4], pages: 3, page: 2 })
    expect(paginate([1, 2], 9, 2).page).toBe(1) // filter shrank the list: back to a page that exists
  })

  it('menampilkan halaman sekitar dan ujung', () => {
    expect(pageList(1, 13)).toEqual([1, 2, 3, '…', 13])
    expect(pageList(7, 13)).toEqual([1, '…', 6, 7, 8, '…', 13])
    expect(pageList(2, 3)).toEqual([1, 2, 3])
  })
})

describe('followUps', () => {
  const lots: Lot[] = [{ lot: 'LOT-H-07', claim: 'Hibrida DEMO-1', n: 60, decision: 'TAHAN', parents: ['TSH1188', 'SCA6'], excluded: 12, estimate: 0.16 }]

  it('mengurutkan dari dampak terbesar dan menggabungkan bibit kontaminan per lot', () => {
    const items = followUps([
      row('SIM-008', { verdict: 'UJI ULANG', call_rate: 0.52 }),
      row('SIM-079', { verdict: 'KONTAMINAN', kind: 'bibit hibrida', lot: 'LOT-H-07' }),
      row('SIM-080', { verdict: 'KONTAMINAN', kind: 'bibit hibrida', lot: 'LOT-H-07' }),
      row('SIM-065', { verdict: 'OFF-TYPE', claim: 'MCC 01', found_as: 'Sulawesi 1' }),
      row('SIM-001'),
    ], lots)
    expect(items.map((i) => [i.id, i.v])).toEqual([['SIM-065', 'OFF-TYPE'], ['LOT-H-07', 'TAHAN'], ['SIM-008', 'UJI ULANG']])
    expect(items[0].text).toBe('Label MCC 01, DNA cocok Sulawesi 1 · pohon induk entres')
    expect(items[1].text).toBe('12 dari 60 bibit bukan TSH1188 × SCA6 · lot ditahan')
    expect(items[2].text).toBe('DNA terbaca 52% · ambil daun ulang')
  })

  it('yang tindak lanjutnya sudah dicatat turun ke bawah verdict yang sama', () => {
    const items = followUps([
      row('SIM-054', { verdict: 'OFF-TYPE', date: '2026-10-15', action: 'uji ulang' }),
      row('SIM-065', { verdict: 'OFF-TYPE', date: '2026-10-06' }),
    ])
    expect(items.map((i) => i.id)).toEqual(['SIM-065', 'SIM-054'])
  })
})

describe('spread', () => {
  it('satu contoh tiap jenis masalah dulu, agar lot ditahan tidak tenggelam', () => {
    const items = followUps([
      row('A', { verdict: 'OFF-TYPE' }), row('B', { verdict: 'OFF-TYPE' }), row('C', { verdict: 'OFF-TYPE' }),
      row('D', { verdict: 'UJI ULANG' }), row('E', { verdict: 'BATANG BAWAH' }),
    ])
    expect(spread(items, 4).map((i) => i.id)).toEqual(['A', 'E', 'D', 'B'])
  })
})

describe('recap', () => {
  it('merekap per kebun dan per lot untuk mitra', () => {
    const r = recap([
      row('A'), row('B', { verdict: 'OFF-TYPE' }), row('C', { verdict: 'UJI ULANG' }), row('D', { verdict: null, call_rate: null }),
      row('E', { provider: 'KE Simulasi Kolaka', verdict: 'KONTAMINAN' }), row('K', { is_control: true }),
    ], [{ lot: 'LOT-H-07', claim: 'Hibrida DEMO-1', n: 60, decision: 'TAHAN', excluded: 12, estimate: 0.16 }])
    expect(r.gardens).toEqual([
      { name: 'KE Simulasi Kolaka', n: 1, verified: 1, ok: 0, bad: 1, rate: 1 },
      { name: 'KE Simulasi Luwu Utara', n: 4, verified: 2, ok: 1, bad: 1, rate: 0.5 },
    ])
    expect(r.lots[0]).toMatchObject({ lot: 'LOT-H-07', decision: 'TAHAN', excluded: 12 })
  })
})

describe('unseenBatches', () => {
  const b = (id: number, analyzed_at: string | null) => ({ id, analyzed_at }) as BatchSummary

  it('hasil lab yang masuk setelah terakhir dilihat', () => {
    const list = [b(1, '2026-10-24T15:56:16+00:00'), b(2, null), b(3, '2026-10-25T08:00:00+00:00')]
    expect(unseenBatches(list, '2026-10-25T00:00:00.000Z').map((x) => x.id)).toEqual([3])
    expect(unseenBatches(list, null).map((x) => x.id)).toEqual([1, 3])
  })
})

describe('parseProfile', () => {
  it('membaca satu SNP per baris dengan pemisah apa pun yang lazim', () => {
    expect(parseProfile('TcSNP619 A:C\nTcSNP1164,CC\n\nTcSNP184\tA/G\nTcSNP222=TT')).toEqual({
      profile: { TcSNP619: 'A:C', TcSNP1164: 'CC', TcSNP184: 'A/G', TcSNP222: 'TT' },
      bad: [],
    })
  })

  it('melaporkan baris yang tidak bisa dibaca', () => {
    expect(parseProfile('TcSNP619\nTcSNP1164 CC').bad).toEqual(['TcSNP619'])
  })
})
