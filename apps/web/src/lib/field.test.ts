import { describe, expect, it } from 'vitest'
import type { Clone, Compare, SampleRow } from './api'
import { byAttention, clonesForKind, formatPosition, headline, initials, isKnownClaim, missingFields, nextSampleId, nextSteps, normalizeSampleId, progressFor, readyClones, readyFirst, searchClones, selectBatch, yieldImpact } from './field'

const clone = (name: string, kind = 'klon'): Clone => ({ name, kind, status: 'referensi', source: '' })
const row = (sample_id: string, over: Partial<SampleRow> = {}): SampleRow => ({
  sample_id, is_control: false, claim: 'ICS60', kind: 'pohon induk entres', lot: '', provider: 'KE Simulasi Luwu Utara',
  province: '', regency: '', lat: null, lon: null, date: '2026-10-01', officer: '', position: '', lab_row: null, call_rate: 0.95,
  verdict: 'COCOK', found_as: null, action: null, lod: null, ...over,
})

describe('isKnownClaim (G-13)', () => {
  const clones = [clone('ICS60'), clone('Sulawesi 1')]

  it('mengenali klon walau ditulis dengan spasi, strip, atau huruf kecil', () => {
    expect(isKnownClaim('ics-60', clones)).toBe(true)
    expect(isKnownClaim('SULAWESI1', clones)).toBe(true)
  })

  it('menandai klon yang tidak ada di registri', () => {
    expect(isKnownClaim('MCC 03', clones)).toBe(false)
  })

  it('klaim kosong belum perlu diperingatkan', () => {
    expect(isKnownClaim('  ', clones)).toBe(true)
  })
})

describe('clonesForKind', () => {
  it('bibit hibrida hanya menawarkan hibrida, jenis lain hanya klon', () => {
    const all = [clone('ICS60'), clone('Hibrida DEMO-1', 'hibrida')]

    expect(clonesForKind('bibit hibrida', all).map((c) => c.name)).toEqual(['Hibrida DEMO-1'])
    expect(clonesForKind('pohon induk entres', all).map((c) => c.name)).toEqual(['ICS60'])
  })
})

describe('byAttention', () => {
  it('mendahulukan vonis yang perlu tindakan, lalu yang terbaru', () => {
    const rows = [
      row('COCOK-baru', { date: '2026-10-20' }),
      row('UJI', { verdict: 'UJI ULANG', date: '2026-10-09' }),
      row('OFF-lama', { verdict: 'OFF-TYPE', date: '2026-10-03' }),
      row('OFF-baru', { verdict: 'OFF-TYPE', date: '2026-10-12' }),
    ]

    expect(byAttention(rows).map((r) => r.sample_id)).toEqual(['OFF-baru', 'OFF-lama', 'UJI', 'COCOK-baru'])
  })

  it('tidak menampilkan kontrol plate dan sampel yang belum ada hasil lab', () => {
    const rows = [row('KTRL', { is_control: true }), row('MENUNGGU', { verdict: null }), row('ADA')]

    expect(byAttention(rows).map((r) => r.sample_id)).toEqual(['ADA'])
  })
})

describe('progressFor', () => {
  it('menghitung sampel kebun ini terhadap anjuran dari skor risiko', () => {
    const rows = [row('A'), row('B'), row('C', { provider: 'KE Lain' }), row('K', { is_control: true })]

    expect(progressFor('KE Simulasi Luwu Utara', rows, 38)).toEqual({ done: 2, target: 38 })
  })
})

describe('yieldImpact', () => {
  it('mengambil selisih hasil per hektare dari uji lapang yang sama', () => {
    const compare: Compare = {
      same_trial: [
        { label: 'Hasil (kg/ha/tahun)', paid: 3672.1, received: 2772.3, unit: 'kg/ha/yr', pct: -25, worse: true, site: 'North Luwu', year: '2013-2014', source: 'Susilo dkk. 2015' },
        { label: 'Hasil (kg per 1.000 pohon)', paid: 1042.5, received: 1387.5, unit: 'kg', pct: 33, worse: false, site: 'Pinrang', year: '2011', source: 'ACIAR' },
      ],
    }

    expect(yieldImpact(compare)).toEqual({ pct: -25, paid: 3672.1, received: 2772.3, source: 'Susilo dkk. 2015', site: 'North Luwu' })
  })

  it('tidak mengarang dampak bila uji lapang tidak membandingkan hasil', () => {
    expect(yieldImpact({ same_trial: [] })).toBeNull()
  })
})

describe('nextSteps', () => {
  it('OFF-TYPE: jangan ambil entres, ganti dengan klon yang benar', () => {
    expect(nextSteps('OFF-TYPE', 'MCC 01')[1]).toBe('Ganti dengan entres MCC 01 yang terverifikasi')
  })

  it('COCOK tidak meminta tindakan', () => {
    expect(nextSteps('COCOK', 'ICS60')).toEqual([])
  })
})

describe('selectBatch', () => {
  it('memakai batch yang dipilih bila ada di daftar', () => {
    expect(selectBatch(2, [1, 2])).toBe(2)
  })

  it('jatuh ke batch terbaru bila pilihan lama sudah tidak ada', () => {
    expect(selectBatch(9, [1, 2])).toBe(2)
  })

  it('tetap memakai pilihan selama daftar belum termuat', () => {
    expect(selectBatch(2, undefined)).toBe(2)
  })

  it('tidak ada batch berarti belum ada pilihan', () => {
    expect(selectBatch(null, [])).toBeNull()
  })
})

describe('headline', () => {
  it('OFF-TYPE menyebut label dan DNA yang ditemukan', () => {
    expect(headline('OFF-TYPE', 'MCC 01', 'Sulawesi 1')).toBe('Labelnya MCC 01, tapi DNA-nya Sulawesi 1.')
  })

  it('OFF-TYPE tanpa klon yang cocok tetap jujur', () => {
    expect(headline('OFF-TYPE', 'MCC 01', null)).toBe('Labelnya MCC 01, tapi DNA-nya bukan MCC 01.')
  })

  it('COCOK menegaskan klaimnya benar', () => {
    expect(headline('COCOK', 'ICS60', null)).toBe('Benar ICS60.')
  })
})

describe('nextSampleId (contoh QR simulasi)', () => {
  it('melanjutkan nomor SIM tertinggi di batch', () => {
    expect(nextSampleId(['SIM-001', 'SIM-135', 'KTRL-NTC'])).toBe('SIM-136')
  })

  it('batch kosong mulai dari SIM-001', () => {
    expect(nextSampleId([])).toBe('SIM-001')
  })

  it('tidak memakai nomor yang masih menunggu di antrean', () => {
    expect(nextSampleId(['SIM-135', 'SIM-136'])).toBe('SIM-137')
  })
})

describe('searchClones', () => {
  const registry = ['CCN51', 'ICS1', 'ICS60', 'MCC 01', 'MCC 02', 'Sulawesi 1', 'TSH1188']

  it('mengabaikan spasi, strip, dan huruf besar/kecil', () => {
    expect(searchClones(registry, 'mcc-01', [], 10)).toEqual(['MCC 01'])
  })

  it('nama yang diawali kata kunci tampil lebih dulu', () => {
    expect(searchClones(['PICS3', 'ICS60', 'ICS1'], 'ics', [], 10)).toEqual(['ICS1', 'ICS60', 'PICS3'])
  })

  it('klon yang terdaftar di kebun ini tampil paling atas', () => {
    expect(searchClones(registry, '', ['Sulawesi 1', 'MCC 01'], 3)).toEqual(['MCC 01', 'Sulawesi 1', 'CCN51'])
  })
})

describe('missingFields', () => {
  const complete = { batchId: 1, sampleId: 'LUW-001', claim: 'B14/9', checks: ['a', 'b'], checked: ['a', 'b'] }

  it('menyebut ID sampel bila hanya itu yang kosong', () => {
    expect(missingFields({ ...complete, sampleId: '  ' })).toEqual(['ID sampel'])
  })

  it('menyebut jumlah prosedur yang belum dicentang', () => {
    expect(missingFields({ ...complete, checked: ['a'] })).toEqual(['1 prosedur'])
  })

  it('form lengkap tidak menyisakan apa pun', () => {
    expect(missingFields(complete)).toEqual([])
  })
})

describe('normalizeSampleId', () => {
  it('ID yang diketik huruf kecil disimpan huruf besar tanpa spasi di tepi', () => {
    expect(normalizeSampleId('  luw-001 ')).toBe('LUW-001')
  })
})

describe('readyClones', () => {
  it('hanya klon dengan referensi siap yang ditawarkan', () => {
    const all: Clone[] = [
      { name: 'ICS60', kind: 'klon', status: 'referensi', source: '' },
      { name: 'MCC 02', kind: 'klon', status: 'menunggu referensi', source: '' },
      { name: 'X1', kind: 'klon', status: 'tidak lengkap', source: '' },
      { name: 'X2', kind: 'klon', status: 'tidak konsisten', source: '' },
    ]

    expect(readyClones(all).map((c) => c.name)).toEqual(['ICS60'])
  })
})

describe('initials', () => {
  it('dua huruf pertama dari nama petugas', () => {
    expect(initials('Pengawas uji lapangan')).toBe('PU')
  })

  it('nama kosong memakai inisial peran Pengawas benih', () => {
    expect(initials('  ')).toBe('PB')
  })
})

describe('formatPosition', () => {
  it('menulis posisi pohon di kebun', () => {
    expect(formatPosition({ block: ' B ', row: '4', tree: '12' })).toBe('Blok B, baris 4, no. 12')
    expect(formatPosition({ block: 'C', row: '', tree: '' })).toBe('Blok C')
    expect(formatPosition({ block: '', row: '', tree: '' })).toBe('')
  })
})

describe('readyFirst', () => {
  it('klon yang sudah valid di atas, lalu urut nama dengan angka yang wajar', () => {
    const c = (name: string, status: string): Clone => ({ name, kind: 'klon', status, source: '' })
    const sorted = readyFirst([c('B14/9', 'tidak lengkap'), c('SCA12', 'referensi'), c('MCC 02', 'menunggu referensi'), c('AMAZ6', 'tidak konsisten'), c('SCA6', 'referensi')])
    expect(sorted.map((x) => x.name)).toEqual(['SCA6', 'SCA12', 'B14/9', 'AMAZ6', 'MCC 02'])
  })
})
