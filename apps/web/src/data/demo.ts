// Static demo data (DATA SIMULASI). Every number comes from apps/api after `pnpm --filter api seed` (24 Oct 2026),
// including the SIM-065 story (MCC 01 -> Sulawesi 1). Re-seeding rewrites audit times and hashes; the rest is seeded.
// When a module is wired to the API, delete its block here instead of keeping two sources of truth.

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

export const batch = {
  name: 'Batch demo Sulawesi',
  analyzed: '23 Okt 2026',
  labFile: 'SIMULASI_lab.csv',
  samples: 135,
  controls: 2,
}

export const verdictCounts: [Verdict, number][] = [
  ['COCOK', 59],
  ['SESUAI SILANGAN', 48],
  ['KONTAMINAN', 12],
  ['OFF-TYPE', 6],
  ['BELUM ADA REFERENSI', 4],
  ['UJI ULANG', 2],
  ['TIDAK DIKENAL', 2],
  ['BATANG BAWAH', 2],
]

export const summary = { tested: 135, withVerdict: 129, ok: 107, okRate: '82,9%', problems: 22, followUp: 28 }

export const pipeline = [
  { label: 'Daun diambil', value: '135', sub: '4 kebun entres' },
  { label: 'Diterima lab', value: '135', sub: '+2 kontrol plate' },
  { label: 'Lolos QC data lab', value: '133', sub: '2 perlu daun ulang' },
  { label: 'Ada vonis', value: '129', sub: '4 klon belum ada referensi' },
  { label: 'Tindak lanjut', value: '0/28', sub: 'menunggu pengawas' },
]

export const byProvince = [
  { name: 'Sulawesi Tenggara', rate: 0.2, frac: '15/75' },
  { name: 'Sulawesi Tengah', rate: 0.176, frac: '3/17' },
  { name: 'Sulawesi Selatan', rate: 0.13, frac: '3/23' },
  { name: 'Sulawesi Barat', rate: 0.071, frac: '1/14' },
]

export const byKind = [
  { name: 'Bibit sambung', rate: 0.333, frac: '2/6' },
  { name: 'Bibit hibrida', rate: 0.2, frac: '12/60' },
  { name: 'Pohon induk entres', rate: 0.127, frac: '8/63' },
]

export type ActionItem = { id: string; v: Verdict; desc: string; where: string; href?: string }
export const actions: ActionItem[] = [
  { id: 'SIM-065', v: 'OFF-TYPE', desc: 'Label MCC 01, DNA cocok Sulawesi 1 · pohon induk entres', where: 'KE Luwu Utara · 6 Okt', href: '/hasil/SIM-065' },
  { id: 'LOT-H-07', v: 'TAHAN', desc: '12 dari 60 bibit bukan TSH1188 × SCA6 · lot ditahan', where: 'KE Kolaka · 20 Okt', href: '/hasil' },
  { id: 'SIM-071', v: 'BATANG BAWAH', desc: 'Tunas batang bawah mengambil alih batang atas ICS95', where: 'KE Parigi · 12 Okt' },
  { id: 'SIM-019', v: 'TIDAK DIKENAL', desc: 'Tidak cocok dengan 649 klon · uji genome-wide diusulkan', where: 'KE Kolaka · 20 Okt', href: '/ai' },
  { id: 'SIM-008', v: 'UJI ULANG', desc: 'DNA terbaca 52% · ambil daun ulang', where: 'KE Polman · 9 Okt' },
]

export type SampleRow = { id: string; kind: string; claim: string; v: Verdict; found: string; garden: string; date: string }
export const samples: SampleRow[] = [
  { id: 'SIM-065', kind: 'pohon induk', claim: 'MCC 01', v: 'OFF-TYPE', found: 'Sulawesi 1', garden: 'Luwu Utara', date: '6 Okt' },
  { id: 'SIM-031', kind: 'pohon induk', claim: 'CCN51', v: 'OFF-TYPE', found: 'MOQ6/67', garden: 'Kolaka', date: '12 Okt' },
  { id: 'SIM-042', kind: 'pohon induk', claim: 'ICS60', v: 'OFF-TYPE', found: 'MOQ4/21', garden: 'Parigi', date: '3 Okt' },
  { id: 'SIM-071', kind: 'bibit sambung', claim: 'ICS95', v: 'BATANG BAWAH', found: 'Hibrida DEMO-1', garden: 'Parigi', date: '12 Okt' },
  { id: 'SIM-079', kind: 'bibit hibrida', claim: 'Hibrida DEMO-1', v: 'KONTAMINAN', found: '—', garden: 'Kolaka', date: '20 Okt' },
  { id: 'SIM-077', kind: 'bibit hibrida', claim: 'Hibrida DEMO-1', v: 'SESUAI SILANGAN', found: '—', garden: 'Kolaka', date: '18 Okt' },
  { id: 'SIM-019', kind: 'pohon induk', claim: 'TSH1188', v: 'TIDAK DIKENAL', found: 'uji refleks →', garden: 'Kolaka', date: '20 Okt' },
  { id: 'SIM-066', kind: 'pohon induk', claim: 'MCC 02', v: 'BELUM ADA REFERENSI', found: '—', garden: 'Parigi', date: '7 Okt' },
  { id: 'SIM-008', kind: 'pohon induk', claim: 'ICS95', v: 'UJI ULANG', found: 'DNA 52%', garden: 'Polman', date: '9 Okt' },
  { id: 'SIM-001', kind: 'pohon induk', claim: 'ICS60', v: 'COCOK', found: 'ICS60', garden: 'Luwu Utara', date: '2 Okt' },
  { id: 'SIM-002', kind: 'pohon induk', claim: 'SCA12', v: 'COCOK', found: 'SCA12', garden: 'Parigi', date: '3 Okt' },
]

export const lot = {
  id: 'LOT-H-07',
  claim: 'Hibrida DEMO-1',
  parents: 'TSH1188 × SCA6',
  n: 60,
  excluded: 12,
  estimate: 0.16,
  ci: [0.073, 0.285] as const,
  estimateLabel: '16%',
  ciLabel: '7,3–28,5%',
  limit: 0.05,
}

export const labQc = [
  { tone: 'ok', label: 'DNA terbaca rata-rata', value: '93,5%' },
  { tone: 'ok', label: 'Kontrol positif ICS60', value: 'COCOK' },
  { tone: 'ok', label: 'Kontrol negatif', value: 'bersih' },
  { tone: 'ok', label: 'Pergeseran plate', value: 'tidak ada' },
  { tone: 'warn', label: 'Uji ulang (DNA < 85%)', value: '2 sampel' },
  { tone: 'info', label: 'SNP di luar panel', value: '2 diabaikan' },
] as const

export const uploadChecks = [
  { tone: 'ok', label: 'ID sampel cocok manifest', value: '137/137' },
  { tone: 'ok', label: 'Panel 48 SNP lengkap', value: '48/48' },
  { tone: 'ok', label: 'Untai DNA terbalik', value: '0 dikoreksi' },
  { tone: 'ok', label: 'Pergeseran sumur plate', value: 'tidak ada' },
  { tone: 'ok', label: 'Kontrol positif ICS60', value: 'COCOK' },
  { tone: 'ok', label: 'Kontrol negatif (NTC)', value: 'bersih' },
  { tone: 'warn', label: 'DNA terbaca < 85%', value: '2 → uji ulang' },
  { tone: 'info', label: 'SNP lab di luar panel', value: '2 diabaikan' },
] as const

export const retest = [
  { id: 'SIM-008', well: 'H1', rate: '52%' },
  { id: 'SIM-034', well: 'B5', rate: '50%' },
]

// Deterministic pseudo-random so the plate and fingerprints look the same on every render.
function rng(seed: number) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

export type Well = 'hi' | 'mid' | 'low' | 'fail' | 'pos' | 'ntc'
export const plate: Well[] = (() => {
  const r = rng(11)
  return Array.from({ length: 96 }, (_, i): Well => {
    if (i === 94) return 'pos'
    if (i === 95) return 'ntc'
    if (i === 7 || i === 33) return 'fail' // H1 = SIM-008, B5 = SIM-034 (wells run down columns: A1, B1 … H1, A2)
    const v = r()
    return v < 0.08 ? 'low' : v < 0.55 ? 'mid' : 'hi'
  })
})()

export type Cell = 0 | 1 | 2 | 'miss' | 'diff'
export const fingerprint = (() => {
  const r = rng(7)
  const g = Array.from({ length: 48 }, () => Math.floor(r() * 3) as 0 | 1 | 2)
  const miss = new Set([5, 31]) // 46/48 read
  const refMiss = new Set([12, 27, 40, 44]) // 42 compared
  const comparable = g.map((_, i) => i).filter((i) => !miss.has(i) && !refMiss.has(i))
  const diff = new Set<number>()
  while (diff.size < 23) diff.add(comparable[Math.floor(r() * comparable.length)])
  return {
    sample: g.map((x, i): Cell => (miss.has(i) ? 'miss' : x)),
    claim: g.map((x, i): Cell => (miss.has(i) || refMiss.has(i) ? 'miss' : diff.has(i) ? 'diff' : x)),
    found: g.map((x, i): Cell => (miss.has(i) ? 'miss' : x)),
    registry: Array.from({ length: 48 }, () => Math.floor(r() * 3) as 0 | 1 | 2),
  }
})()

export const sim065 = {
  id: 'SIM-065',
  kind: 'Pohon induk entres',
  garden: 'KE Simulasi Luwu Utara',
  claim: 'MCC 01',
  found: 'Sulawesi 1',
  diff: 24,
  compared: 42,
  allowed: 5,
  callRate: '96%',
  read: '46/48',
  field: [
    { label: 'Lokasi', value: 'Luwu Utara, Sulawesi Selatan' },
    { label: 'GPS', value: '−2,5901 · 120,3278' },
    { label: 'Diambil', value: '6 Okt 2026 · Pengawas 3' },
    { label: 'Lot / kantong', value: 'KE-LUW-IND · baris lab 64' },
  ],
  steps: [
    { ok: true, title: 'Kualitas data lab', detail: '46 dari 48 SNP terbaca (96%) · kontrol plate lolos' },
    { ok: false, title: 'Bandingkan dengan klon yang diklaim', detail: '24 beda dari 42 SNP terhadap MCC 01; dengan error lab 2% wajar sampai 5 beda' },
    { ok: true, title: 'Cari di 649 klon registri', detail: 'Paling cocok: Sulawesi 1 (0 beda). Kandidat berikutnya ≥ 16 beda' },
  ],
  // Field-trial facts (Susilo dkk. 2015, Luwu Utara 2013–14), not model predictions.
  impact: { pct: '−25%', yield: '3.672 → 2.772 kg/ha/tahun' },
  traits: [
    { label: 'Bobot biji kering', value: '1,61 g → 1,10 g', better: false },
    { label: 'Busuk buah', value: '1,15% → 2,58%', better: false },
    { label: 'Kerusakan PBK', value: '20,96% → 9,29%', better: true },
  ],
}

export const providers = [
  {
    name: 'KE Simulasi Kolaka', region: 'Kolaka Utara, Sultra', score: 57, tier: 'Tinggi', recommend: 54, history: '15/75',
    factors: [['Off-type historis 15/75 (±19% setelah dihaluskan)', 47], ['1 lot benih pernah ditahan', 10]] as [string, number][],
    clones: ['ICS60', 'ICS95', 'TSH1188', 'SCA6'], more: 2,
  },
  {
    name: 'KE Simulasi Parigi', region: 'Parigi Moutong, Sulteng', score: 52, tier: 'Tinggi', recommend: 51, history: '3/17',
    factors: [['Off-type historis 3/17 (±15% setelah dihaluskan)', 37], ['Riwayat masih sedikit (17 sampel)', 15]] as [string, number][],
    clones: ['ICS60', 'ICS95', 'TSH1188', 'SCA6'], more: 3, warn: 'MCC 02 belum punya sidik jari referensi',
  },
  {
    name: 'KE Simulasi Polman', region: 'Polewali Mandar, Sulbar', score: 36, tier: 'Sedang', recommend: 41, history: '1/14',
    factors: [['Off-type historis 1/14 (±8% setelah dihaluskan)', 21], ['Riwayat masih sedikit (14 sampel)', 15]] as [string, number][],
    clones: ['ICS60', 'ICS95', 'TSH1188', 'SCA6'], more: 2,
  },
  {
    name: 'KE Simulasi Luwu Utara', region: 'Luwu Utara, Sulsel', score: 30, tier: 'Sedang', recommend: 38, history: '3/23',
    factors: [['Off-type historis 3/23 (±12% setelah dihaluskan)', 30]] as [string, number][],
    clones: ['Sulawesi 1', 'MCC 01', 'Sulawesi 2', 'ICS60'], more: 5,
  },
]

export const registryStatus = [
  { value: '613', label: 'Referensi siap', note: 'Bisa dipakai untuk vonis', tone: 'ok' },
  { value: '20', label: 'Tidak lengkap', note: '< 85% SNP panel terisi', tone: 'warn' },
  { value: '13', label: 'Tidak konsisten', note: 'Sumber saling bertentangan', tone: 'bad' },
  { value: '3', label: 'Menunggu referensi', note: 'Pemilik klon belum kirim', tone: 'info' },
] as const

export const clones = [
  { name: 'Sulawesi 1', source: 'Cornejo 2018 + Nestlé WGS · 2 sumber', ready: true },
  { name: 'MCC 01', source: 'Genom publik Cornejo 2018', ready: true },
  { name: 'Sulawesi 2', source: 'Genom publik Cornejo 2018', ready: true },
  { name: 'MCC 02', source: 'Pemilik klon (belum diterima)', ready: false },
  { name: 'ICS60', source: 'Bekele 2022 · ICGT Trinidad', ready: true },
  { name: 'ICS95', source: 'Bekele 2022 · ICGT Trinidad', ready: true },
  { name: 'TSH1188', source: 'Bekele 2022 · ICGT Trinidad', ready: true },
  { name: 'SCA6', source: 'Bekele 2022 · ICGT Trinidad', ready: true },
  { name: 'CCN51', source: 'Bekele 2022 · ICGT Trinidad', ready: true },
]

// Registered clones show field-trial facts only; trait predictions are for seedlings and unknown trees.
export const sulawesi1 = {
  sk: 'SK Mentan 694/Kpts/SR.120/12/2008',
  agreement: '99,1%',
  agreementNote: '2 sumber sepakat · 681/687 SNP',
  facts: [
    { label: 'Hasil', source: 'Susilo 2015 · Luwu Utara', value: '2.772 kg/ha/tahun' },
    { label: 'Ketahanan VSD', source: '5 sumber sepakat', value: 'tahan' },
    { label: 'Busuk buah', source: 'ICCRI · Rubiyo 2020', value: 'moderat – agak tahan' },
    { label: 'Kadar lemak', source: '3 uji lapang', value: '47,7–50,9%' },
    { label: 'Ukuran biji', source: '3 uji lapang · ACIAR, Rubiyo 2020', value: '96–104 biji/100 g' },
  ],
}

// Real black-pod ranking of one Jacquotte dkk. 2026 family (CC0), PA-51 × ICS-95; lower = more resistant.
export const seedlingScores = [
  7.73, 10.0, 11.18, 12.4, 13.72, 14.11, 14.69, 15.04, 15.05, 16.14, 16.52, 16.53, 17.37, 18.03, 18.03, 18.42, 19.16, 19.2, 19.31,
  20.4, 20.51, 21.12, 21.34, 21.49, 21.51, 21.65, 21.68, 21.79, 22.69, 22.78, 22.93, 23.5, 23.63, 25.44, 25.46, 25.88, 26.62,
  26.77, 28.42,
]
export const seedlingKeep = 10

export const crossSeedlings = [
  { name: 'Semaian 12', beans: 44.23 },
  { name: 'Semaian 18', beans: 43.59 },
  { name: 'Semaian 02', beans: 43.51 },
  { name: 'Semaian 23', beans: 43.41 },
  { name: 'Semaian 25', beans: 43.35 },
]

export const ancestry = [
  { name: 'Criollo', share: 0.512, color: '#7B4DFF' },
  { name: 'Iquitos', share: 0.246, color: '#B9A2FF' },
  { name: 'Amelonado', share: 0.217, color: '#FF8A3D' },
  { name: 'Lainnya', share: 0.025, color: '#D9C9B9' },
]

export const modelLimits = [
  { name: 'Busuk buah', ok: 'ranking dalam satu silangan', no: 'membandingkan klon', warnOnly: false },
  { name: 'Komponen hasil', ok: 'r 0,51–0,66 antar-klon', no: 'hasil panen per hektare', warnOnly: false },
  { name: 'Asal-usul', ok: '78% benar', no: '6–8% yakin tapi salah', warnOnly: true },
]

export const audit = [
  { time: '15:56:11', title: 'Batch dibuat', detail: '135 sampel lapangan' },
  { time: '15:56:15', title: 'Hasil lab diunggah', detail: 'sha256 30fd439d…' },
  { time: '15:56:16', title: 'Verifikasi dijalankan', detail: '135 vonis tercatat' },
]
