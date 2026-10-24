// Field-app rules that pages share: sample kinds, procedure checklist, claim guard, result ordering.
import type { Verdict } from '../data/demo'
import type { Clone, Compare, SampleRow } from './api'

export const KINDS = [
  { value: 'pohon induk entres', label: 'Pohon induk' },
  { value: 'bibit sambung', label: 'Bibit sambung' },
  { value: 'bibit hibrida', label: 'Bibit hibrida' },
] as const

export const CHECKS: Record<string, string[]> = {
  'pohon induk entres': ['Daun muda dari cabang batang atas, bukan tunas dari pangkal', 'Label kantong = ID sampel', 'Gunting dibersihkan alkohol antar pohon', 'Daun langsung masuk silika gel'],
  'bibit sambung': ['Daun dari tunas DI ATAS bekas sambungan (batang atas)', 'Label kantong = ID sampel', 'Gunting dibersihkan alkohol antar bibit', 'Daun langsung masuk silika gel'],
  'bibit hibrida': ['Bibit diambil acak dari seluruh bedeng, bukan yang paling bagus', 'Label kantong = ID sampel', 'Gunting dibersihkan alkohol antar bibit', 'Daun langsung masuk silika gel'],
}

const norm = (s: string) => s.replace(/[\s\-_.]/g, '').toUpperCase()

// GAPS G-13: a typo in the claim only shows up after the lab, so warn before saving.
export const isKnownClaim = (claim: string, clones: Clone[]) =>
  !claim.trim() || clones.some((c) => norm(c.name) === norm(claim))

// For now the picker offers only clones with a usable reference fingerprint; incomplete, inconsistent and
// pending clones stay out until their references are fixed.
export const readyClones = (clones: Clone[]) => clones.filter((c) => c.status === 'referensi')

export const clonesForKind = (kind: string, clones: Clone[]) =>
  clones.filter((c) => (kind === 'bibit hibrida') === (c.kind === 'hibrida'))

const RANK: Verdict[] = ['OFF-TYPE', 'KONTAMINAN', 'BATANG BAWAH', 'TIDAK DIKENAL', 'UJI ULANG', 'BELUM ADA REFERENSI']
const rank = (v: Verdict) => (RANK.includes(v) ? RANK.indexOf(v) : RANK.length)

// Results that need the officer first, newest first within a verdict; controls and samples still at the lab are left out.
export const byAttention = (rows: SampleRow[]) =>
  rows
    .filter((r): r is SampleRow & { verdict: Verdict } => !r.is_control && r.verdict !== null)
    .sort((a, b) => rank(a.verdict) - rank(b.verdict) || b.date.localeCompare(a.date))

// The chosen batch while it exists; otherwise the newest. A stale list must not override a batch just created.
export function selectBatch(chosen: number | null, ids: number[] | undefined): number | null {
  if (!ids) return chosen
  if (chosen !== null && ids.includes(chosen)) return chosen
  return ids.length ? Math.max(...ids) : null
}

// Mock bag label for the "contoh QR" demo: the next free SIM number, so the API never rejects it as a duplicate.
export function nextSampleId(taken: string[]): string {
  const nums = taken.map((id) => /^SIM-(\d+)$/.exec(id)?.[1]).filter(Boolean).map(Number)
  return `SIM-${String(Math.max(0, ...nums) + 1).padStart(3, '0')}`
}

// Bag labels are upper case. Normalise on save, not while typing: rewriting the value per keystroke breaks
// composing keyboards (phone predictive text, some IMEs, Safari) and swallows what the officer types.
export const normalizeSampleId = (raw: string) => raw.trim().toUpperCase()

// Clone picker search: clones registered for this garden first, then names that start with the query.
export function searchClones(names: string[], q: string, garden: string[], limit: number) {
  const term = norm(q)
  const mine = new Set(garden.map(norm))
  const score = (n: string) => (mine.has(norm(n)) ? 0 : 2) + (norm(n).startsWith(term) ? 0 : 1)
  return names
    .filter((n) => norm(n).includes(term))
    .sort((a, b) => score(a) - score(b) || a.localeCompare(b, undefined, { numeric: true }))
    .slice(0, limit)
}

// What still blocks saving, in the officer's words (shown under the save button).
export function missingFields(f: { batchId: number | null; sampleId: string; claim: string; checks: string[]; checked: string[] }) {
  const open = f.checks.filter((c) => !f.checked.includes(c)).length
  return [
    !f.batchId && 'batch',
    !f.sampleId.trim() && 'ID sampel',
    !f.claim.trim() && 'klon',
    open > 0 && `${open} prosedur`,
  ].filter((x): x is string => !!x)
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'PB'

export const progressFor = (provider: string, rows: SampleRow[], target: number) => ({
  done: rows.filter((r) => !r.is_control && r.provider === provider).length,
  target,
})

// Field-trial fact, not a prediction: only when the same trial compared yield per hectare.
export function yieldImpact(c: Compare) {
  const r = c.same_trial.find((t) => t.label.startsWith('Hasil (kg/ha') && t.pct !== null)
  return r ? { pct: r.pct!, source: r.source, site: r.site } : null
}

export function headline(v: Verdict, claim: string, found: string | null): string {
  switch (v) {
    case 'OFF-TYPE':
      return `Labelnya ${claim}, tapi DNA-nya ${found ?? `bukan ${claim}`}.`
    case 'COCOK':
      return `Benar ${claim}.`
    case 'SESUAI SILANGAN':
      return `Sesuai silangan ${claim}.`
    case 'KONTAMINAN':
      return `Bukan anak silangan ${claim}.`
    case 'BATANG BAWAH':
      return `Daun dari batang bawah, bukan ${claim}.`
    case 'TIDAK DIKENAL':
      return `Bukan ${claim}, dan tidak cocok dengan klon terdaftar.`
    case 'BELUM ADA REFERENSI':
      return `${claim} belum punya sidik jari referensi.`
    case 'UJI ULANG':
      return 'Data lab belum cukup untuk memberi vonis.'
    default:
      return v
  }
}

export function nextSteps(v: Verdict, claim: string): string[] {
  switch (v) {
    case 'OFF-TYPE':
      return ['Tandai pohon: jangan ambil entres', `Ganti dengan entres ${claim} yang terverifikasi`, 'Ragu? minta uji ulang dulu sebelum menebang']
    case 'BATANG BAWAH':
      return ['Daun berasal dari batang bawah, bukan batang atas', 'Ambil ulang sampel dari tunas batang atas']
    case 'TIDAK DIKENAL':
      return ['Jangan dipakai sebagai sumber entres', 'Uji genome-wide diusulkan untuk melihat asal-usulnya']
    case 'UJI ULANG':
      return ['Data lab tidak cukup', 'Ulangi genotyping dari sampel daun yang sama']
    case 'BELUM ADA REFERENSI':
      return [`${claim} belum punya sidik jari referensi`, 'Belum bisa diverifikasi; simpan sampel sampai referensi tersedia']
    case 'KONTAMINAN':
      return ['Bibit ini bukan anak silangan yang diklaim', 'Keputusan lot ada di halaman Hasil verifikasi']
    default:
      return []
  }
}
