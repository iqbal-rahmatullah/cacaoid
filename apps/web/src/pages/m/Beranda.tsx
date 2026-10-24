import { Link } from 'react-router-dom'
import { Bell, CircleCheck, CircleX, CloudOff, GitBranch, ScanLine } from 'lucide-react'
import type { Verdict } from '../../data/demo'
import { Dark, SimBadge, VERDICT, cx } from '../../components/ui'

const RECENT: { id: string; v: Verdict; desc: string; isNew?: boolean; to?: string }[] = [
  { id: 'SIM-065', v: 'OFF-TYPE', desc: 'Label MCC 01 · DNA Sulawesi 1', isNew: true, to: '/m/hasil/SIM-065' },
  { id: 'SIM-074', v: 'BATANG BAWAH', desc: 'Tunas batang bawah · bibit sambung' },
  { id: 'SIM-001', v: 'COCOK', desc: 'ICS60 · pohon induk' },
]
const ICON = { 'OFF-TYPE': CircleX, 'BATANG BAWAH': GitBranch, COCOK: CircleCheck } as const

export default function Beranda() {
  const done = 12
  const target = 38
  return (
    <div className="space-y-5 pt-1">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-pod text-sm font-extrabold text-choc">P3</span>
        <span className="flex-1">
          <span className="block text-[12.5px] text-mute">Selamat pagi,</span>
          <span className="font-display text-xl font-bold tracking-tight">Pengawas 3</span>
        </span>
        <SimBadge />
        <span className="relative grid size-[42px] place-items-center rounded-full border border-line bg-white">
          <Bell size={18} />
          <span className="absolute top-2 right-2.5 size-2.5 rounded-full border-2 border-white bg-bad" />
        </span>
      </div>

      <div className="flex items-center gap-2.5 rounded-2xl border border-warn/20 bg-warn-soft px-3.5 py-3">
        <CloudOff size={18} className="text-warn" />
        <span>
          <span className="block text-[12.5px] font-bold text-[#7A4A00]">Tanpa sinyal · 3 sampel di antrean</span>
          <span className="text-[11.5px] text-[#9A6A1F]">Terkirim otomatis saat online</span>
        </span>
      </div>

      <Dark glows={[['#3DDC97', '100% 0%', '160% 120%']]} className="space-y-3.5 rounded-[28px] p-[22px]">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-extrabold tracking-[0.12em] text-mint">TUGAS HARI INI</span>
          <span className="rounded-full bg-pod/20 px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#FFB27A]">Risiko sedang</span>
        </div>
        <p className="font-display text-[26px] leading-none font-bold tracking-tight">KE Luwu Utara</p>
        <p className="flex items-end gap-2">
          <span className="font-display text-[54px] leading-[0.9] font-bold tracking-[-0.04em] text-mint">{done}</span>
          <span className="pb-1 text-base font-bold text-white/60">/ {target} daun</span>
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-mint" style={{ width: `${(done / target) * 100}%` }} />
        </div>
        <p className="text-xs text-white/55">Jumlah dianjurkan dari riwayat kebun · {target - done} lagi</p>
        <Link to="/m/ambil" className="flex items-center justify-center gap-2 rounded-full bg-mint py-3.5 text-[14.5px] font-extrabold text-choc">
          <ScanLine size={18} /> Lanjut ambil sampel
        </Link>
      </Dark>

      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Hasil lab terbaru</h2>
          <span className="text-[13px] font-bold text-mint-deep">Semua</span>
        </div>
        {RECENT.map((r) => {
          const Icon = ICON[r.v as keyof typeof ICON]
          const body = (
            <>
              <span className={cx('grid size-10 place-items-center rounded-[13px]', VERDICT[r.v].soft, VERDICT[r.v].text)}>
                <Icon size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <b className="font-mono text-[12.5px]">{r.id}</b>
                  {r.isNew && <span className="rounded-md bg-bad px-1.5 text-[9px] font-extrabold text-white">BARU</span>}
                </span>
                <span className="block truncate text-[11.5px] text-body">{r.desc}</span>
              </span>
              <span className={cx('rounded-full px-2 py-0.5 text-[9.5px] font-extrabold whitespace-nowrap', VERDICT[r.v].soft, VERDICT[r.v].text)}>{r.v}</span>
            </>
          )
          const cls = cx('flex items-center gap-3 rounded-[18px] border bg-white p-3.5', r.isNew ? 'border-bad/25' : 'border-line')
          return r.to ? (
            <Link key={r.id} to={r.to} className={cls}>
              {body}
            </Link>
          ) : (
            <div key={r.id} className={cls}>
              {body}
            </div>
          )
        })}
      </section>
    </div>
  )
}
