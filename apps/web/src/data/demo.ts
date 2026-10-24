// Static demo data for the AI page only (DATA SIMULASI / published examples). The AI modules are Major in the
// ROADMAP: they stay static until the models are researched further. Every other page reads apps/api.

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
