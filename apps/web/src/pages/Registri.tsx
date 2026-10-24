import { BadgeCheck, ChevronRight, CircleDashed, Dna, FileUp, GitCompareArrows, Hourglass, MapPin, Plus, ScrollText, Split, Sprout, Warehouse } from 'lucide-react'
import { Link } from 'react-router-dom'
import { clones, fingerprint, registryStatus, sulawesi1 } from '../data/demo'
import { Card, Fingerprint, IconTile, Overline, TONE, TopBar, cx } from '../components/ui'

const STATUS_ICONS = { ok: BadgeCheck, warn: CircleDashed, bad: Split, info: Hourglass }

export default function Registri() {
  return (
    <>
      <TopBar
        crumb={['Data', 'Registri klon']}
        title="Registri klon"
        sub="649 sidik jari referensi · genom publik & bank gen · panel 48 SNP"
        secondary={{ icon: FileUp, label: 'Impor referensi' }}
        primary={{ icon: Plus, label: 'Tambah klon' }}
      />

      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {registryStatus.map((r) => (
          <Card key={r.label} className="flex items-center gap-3.5 p-[18px]">
            <IconTile icon={STATUS_ICONS[r.tone]} className={cx('size-11 rounded-[14px]', TONE[r.tone].soft, TONE[r.tone].text)} />
            <span>
              <span className="block font-display text-[28px] leading-none font-bold tracking-tight">{r.value}</span>
              <span className="mt-1 block text-[12.5px] font-bold text-body">{r.label}</span>
              <span className="block text-[11px] text-mute">{r.note}</span>
            </span>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[440px_minmax(0,1fr)]">
        <Card className="p-2.5 pt-[18px]">
          <div className="flex gap-1.5 px-2 pb-2 text-xs font-bold">
            <span className="rounded-full bg-choc px-3 py-1.5 text-white">Klon Indonesia</span>
            <span className="rounded-full bg-cream px-3 py-1.5 text-body">Semua 649</span>
            <span className="rounded-full bg-cream px-3 py-1.5 text-body">Bermasalah 33</span>
          </div>
          <ul>
            {clones.map((c, i) => {
              const sel = i === 0
              return (
                <li key={c.name} className={cx('flex items-center gap-3 rounded-[14px] border px-3 py-[11px]', sel ? 'border-line bg-cream' : 'border-transparent')}>
                  <IconTile icon={Dna} size="sm" className={sel ? 'size-9 bg-choc text-mint' : 'size-9 bg-cream text-body'} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-bold">{c.name}</span>
                    <span className="block truncate text-[11.5px] text-mute">{c.source}</span>
                  </span>
                  <span className={cx('rounded-full px-2.5 py-1 text-[11px] font-bold', c.ready ? 'bg-ok-soft text-ok' : 'bg-info-soft text-info')}>
                    {c.ready ? 'Referensi' : 'Menunggu'}
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card className="flex flex-col gap-[18px]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h2 className="font-display text-[34px] leading-none font-bold tracking-tight">Sulawesi 1</h2>
            <div className="rounded-2xl bg-mint-soft px-4 py-3 text-right text-mint-deep">
              <p className="font-display text-[26px] leading-none font-bold">{sulawesi1.agreement}</p>
              <p className="mt-1 text-[11px] font-semibold">{sulawesi1.agreementNote}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2.5 py-1 text-ok">
              <BadgeCheck size={12} /> Referensi siap
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-body">
              <ScrollText size={12} /> {sulawesi1.sk}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-body">
              <MapPin size={12} /> Dipakai di KE Luwu Utara
            </span>
          </div>

          <div>
            <Overline>Sidik jari · 48 SNP panel</Overline>
            <Fingerprint cells={fingerprint.registry} height="h-11" className="mt-2" />
          </div>

          <div className="rounded-[18px] bg-cream p-[18px]">
            <p className="flex items-center gap-2 pb-2 text-sm font-extrabold">
              <Sprout size={16} className="text-mint-deep" /> Fakta uji lapang
            </p>
            {sulawesi1.facts.map((f) => (
              <div key={f.label} className="flex items-center justify-between gap-4 border-t border-line py-2">
                <span>
                  <span className="block text-[12.5px] font-bold">{f.label}</span>
                  <span className="text-[11px] text-mute">{f.source}</span>
                </span>
                <span className="text-right text-[13px] font-bold">{f.value}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2.5">
            <Overline>Muncul di verifikasi</Overline>
            <Link to="/hasil/SIM-065" className="flex items-center gap-3 rounded-2xl border border-line px-3.5 py-3 transition hover:bg-cream/60">
              <IconTile icon={GitCompareArrows} size="sm" className="size-9 bg-bad-soft text-bad" />
              <span className="flex-1">
                <span className="block font-mono text-[13px] font-bold">SIM-065</span>
                <span className="text-xs text-body">Pohon induk diklaim MCC 01 · KE Luwu Utara · 6 Okt</span>
              </span>
              <span className="rounded-full bg-bad-soft px-2.5 py-0.5 text-[10.5px] font-extrabold text-bad">OFF-TYPE</span>
              <ChevronRight size={16} className="text-mute" />
            </Link>
            <Link to="/penyedia" className="flex items-center gap-3 rounded-2xl border border-line px-3.5 py-3 transition hover:bg-cream/60">
              <IconTile icon={Warehouse} size="sm" className="size-9 bg-cream text-body" />
              <span className="flex-1">
                <span className="block text-[13px] font-bold">KE Luwu Utara</span>
                <span className="text-xs text-body">Kebun entres terdaftar memakai Sulawesi 1 sebagai klon resmi</span>
              </span>
              <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-[10.5px] font-extrabold text-ok">TERDAFTAR</span>
              <ChevronRight size={16} className="text-mute" />
            </Link>
          </div>
        </Card>
      </div>
    </>
  )
}
