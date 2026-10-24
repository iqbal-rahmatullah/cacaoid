import { Check, FileCheck, FileSpreadsheet, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { plate, retest, uploadChecks } from '../data/demo'
import type { Well } from '../data/demo'
import { Card, CardHead, Dark, TONE, TopBar, cx } from '../components/ui'

const STEPS = [
  { state: 'done', title: 'Pilih batch', detail: 'Batch demo Sulawesi · 135 sampel' },
  { state: 'now', title: 'Unggah file genotipe', detail: 'SIMULASI_lab.csv · sudah diperiksa' },
  { state: 'next', title: 'Jalankan verifikasi', detail: '±4 detik untuk 135 sampel' },
] as const

const WELL: Record<Well, { cls: string; label: string }> = {
  hi: { cls: 'bg-mint-deep', label: '≥ 95%' },
  mid: { cls: 'bg-mint', label: '90–95%' },
  low: { cls: 'bg-[#FFC24B]', label: '85–90%' },
  fail: { cls: 'bg-bad', label: '< 85% · uji ulang' },
  pos: { cls: 'bg-choc ring-[3px] ring-inset ring-mint', label: 'kontrol positif' },
  ntc: { cls: 'bg-white ring-2 ring-inset ring-choc', label: 'kontrol negatif' },
}
const ROWS = 'ABCDEFGH'

export default function Unggah() {
  return (
    <>
      <TopBar
        crumb={['Verifikasi', 'Unggah hasil lab']}
        title="Unggah hasil lab"
        sub="Batch demo Sulawesi · 135 sampel + 2 kontrol · 2 plate"
        secondary={{ icon: FileSpreadsheet, label: 'Manifest plate' }}
        primary={{ icon: Play, label: 'Jalankan verifikasi', to: '/hasil' }}
      />

      <Card className="mt-6 flex flex-col gap-4 px-6 py-[18px] md:flex-row md:items-center">
        {STEPS.map((s, i) => (
          <div key={s.title} className="flex flex-1 items-center gap-4">
            <div className="flex items-center gap-3">
              <span
                className={cx(
                  'grid size-9 shrink-0 place-items-center rounded-full text-sm font-extrabold',
                  s.state === 'done' && 'bg-mint text-choc',
                  s.state === 'now' && 'bg-choc text-mint',
                  s.state === 'next' && 'border border-line bg-cream text-mute',
                )}
              >
                {s.state === 'done' ? <Check size={18} /> : i + 1}
              </span>
              <span>
                <span className={cx('block text-sm font-bold', s.state === 'next' && 'text-mute')}>{s.title}</span>
                <span className="block text-xs text-mute">{s.detail}</span>
              </span>
            </div>
            {i < STEPS.length - 1 && <span className={cx('hidden h-0.5 flex-1 rounded md:block', i === 0 ? 'bg-mint' : 'bg-line')} />}
          </div>
        ))}
      </Card>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_372px]">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3.5 rounded-[20px] border border-mint-deep/25 bg-mint-soft px-[18px] py-4">
            <span className="grid size-11 place-items-center rounded-[13px] bg-white text-mint-deep">
              <FileCheck size={21} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-sm font-bold">SIMULASI_lab.csv</span>
              <span className="block text-xs text-body">137 sampel × 50 SNP · CSV genotipe dari lab · diunggah 23 Okt 2026, 15:22</span>
            </span>
            <button type="button" className="rounded-full border border-line bg-white px-3.5 py-2 text-[12.5px] font-bold">
              Ganti berkas
            </button>
          </div>

          <Card className="flex-1">
            <CardHead
              title="Peta plate · DNA terbaca per sumur"
              sub="Plate 1 dari 2 · 96 sumur · baris A–H × kolom 1–12"
              right={
                <div className="flex gap-1 rounded-full bg-cream p-1 text-xs font-bold">
                  <span className="rounded-full bg-white px-3.5 py-1.5">Plate 1</span>
                  <span className="px-3.5 py-1.5 text-mute">Plate 2</span>
                </div>
              }
            />
            <div className="mt-5 overflow-x-auto">
              <div className="grid w-max grid-cols-[18px_repeat(12,38px)] gap-2 text-center text-[10.5px] font-bold text-mute">
                <span />
                {Array.from({ length: 12 }, (_, c) => (
                  <span key={c}>{c + 1}</span>
                ))}
                {Array.from({ length: 8 }, (_, r) => [
                  <span key={`r${r}`} className="self-center text-left">
                    {ROWS[r]}
                  </span>,
                  ...Array.from({ length: 12 }, (_, c) => {
                    const i = c * 8 + r
                    const w = plate[i]
                    const name = w === 'pos' ? 'KTRL-POS-ICS60' : w === 'ntc' ? 'KTRL-NTC' : `SIM-${String(i + 1).padStart(3, '0')}`
                    return (
                      <span
                        key={i}
                        title={`${ROWS[r]}${c + 1} · ${name} · ${WELL[w].label}`}
                        className={cx('size-[38px] rounded-full transition hover:scale-110', WELL[w].cls)}
                      />
                    )
                  }),
                ])}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {Object.values(WELL).map((w) => (
                <span key={w.label} className="flex items-center gap-1.5 text-[11.5px] font-semibold text-body">
                  <span className={cx('size-3 rounded-full', w.cls)} />
                  {w.label}
                </span>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {retest.map((r) => (
                <div key={r.id} className="flex items-center gap-2.5 rounded-[14px] bg-bad-soft px-3 py-2.5">
                  <span className="grid size-[34px] place-items-center rounded-full bg-bad text-[11.5px] font-extrabold text-white">{r.well}</span>
                  <span>
                    <span className="block text-[12.5px] font-bold">
                      {r.id} · DNA terbaca {r.rate}
                    </span>
                    <span className="block text-[11.5px] text-body">Otomatis jadi UJI ULANG, bukan OFF-TYPE</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card className="flex-1 px-[22px] py-5">
            <CardHead title="Pemeriksaan otomatis" sub="Dijalankan sebelum ada vonis" />
            <ul className="mt-2">
              {uploadChecks.map((c) => {
                const t = TONE[c.tone]
                return (
                  <li key={c.label} className="flex items-center gap-2.5 border-b border-line py-2.5 last:border-0">
                    <span className={cx('grid size-[26px] place-items-center rounded-lg', t.soft, t.text)}>
                      <t.icon size={14} />
                    </span>
                    <span className="flex-1 text-[12.5px] text-body">{c.label}</span>
                    <span className={cx('text-[12.5px] font-bold', c.tone === 'warn' && 'text-warn')}>{c.value}</span>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Dark glows={[['#3DDC97', '100% 100%', '140% 140%']]} className="p-[22px]">
            <p className="text-[10.5px] font-extrabold tracking-[0.1em] text-mint">SIAP DIVERIFIKASI</p>
            <div className="mt-3 flex gap-5">
              {[
                ['135', 'sampel'],
                ['48', 'SNP'],
                ['649', 'klon registri'],
              ].map(([n, l]) => (
                <span key={l}>
                  <span className="block font-display text-[30px] leading-none font-bold tracking-tight">{n}</span>
                  <span className="text-[11.5px] text-white/50">{l}</span>
                </span>
              ))}
            </div>
            <Link to="/hasil" className="mt-4 flex items-center justify-center gap-2 rounded-full bg-mint py-3.5 text-sm font-extrabold text-choc transition hover:brightness-105">
              <Play size={16} /> Jalankan verifikasi
            </Link>
          </Dark>
        </div>
      </div>
    </>
  )
}
