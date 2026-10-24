import { BookOpen, Check, GitFork, ScanSearch, Shuffle, Sparkles, TriangleAlert, Upload, Wheat, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { ancestry, crossSeedlings, modelLimits, seedlingKeep, seedlingScores } from '../data/demo'
import { TopBar } from '../components/TopBar'
import { Card, Dark, IconTile, Overline, cx } from '../components/ui'

const maxScore = Math.max(...seedlingScores)

function ModelCard({ icon, title, sub, tag, action, children }: { icon: LucideIcon; title: string; sub: string; tag: ReactNode; action: { icon: LucideIcon; label: string }; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-3 p-[22px]">
      <div className="flex items-start gap-2.5">
        <IconTile icon={icon} size="sm" className="size-9 bg-bean-soft text-bean" />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[17px] leading-snug font-bold tracking-tight">{title}</span>
          <span className="text-[11.5px] text-mute">{sub}</span>
        </span>
        {tag}
      </div>
      {children}
      <button type="button" className="mt-auto flex items-center justify-center gap-2 rounded-full bg-bean-soft py-2.5 text-[12.5px] font-bold text-bean-deep transition hover:brightness-95">
        <action.icon size={15} className="text-bean" /> {action.label}
      </button>
    </Card>
  )
}

export default function Ai() {
  return (
    <>
      <TopBar
        crumb={['AI & laporan', 'Analitik AI']}
        title="Analitik AI · alat pemulia"
        sub="Model dilatih pada data terbuka · setiap angka = hasil validasi pada data publik"
        secondary={{ icon: BookOpen, label: 'Kartu model' }}
        primary={{ icon: Upload, label: 'Unggah genotipe semaian' }}
      />

      <Dark glows={[['#7B4DFF', '85% 0%', '120% 160%'], ['#3DDC97', '0% 100%', '80% 100%']]} className="mt-6 grid gap-8 p-7 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="flex flex-col gap-3.5">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-bean/20 px-3 py-1.5 text-[11px] font-extrabold tracking-[0.08em] text-[#CDBBFF]">
            <Sparkles size={13} className="text-[#B9A2FF]" /> MODEL AI · BUSUK BUAH
          </span>
          <h2 className="font-display text-[30px] leading-[1.08] font-bold tracking-[-0.025em]">Semaian mana yang paling tahan busuk buah?</h2>
          <p className="text-[13px] leading-relaxed text-white/65">
            Model mengurutkan semaian dalam satu silangan dari DNA-nya, sebelum bertahun-tahun di lapang. Simpan 25% teratas untuk uji lapang.
          </p>
          <div className="mt-auto grid grid-cols-2 gap-3">
            {[
              ['−14%', 'busuk buah bila simpan 25% teratas', 'text-[#B9A2FF]'],
              ['0,40', 'korelasi di silangan yang tidak dilatih', 'text-mint'],
            ].map(([v, l, c]) => (
              <div key={v} className="rounded-2xl bg-white/5 px-3.5 py-3">
                <p className={cx('font-display text-[28px] leading-none font-bold tracking-tight', c)}>{v}</p>
                <p className="mt-1 text-[11px] leading-snug text-white/55">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-h-[320px] flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <span>
              <span className="block text-[15px] font-bold">PA-51 × ICS-95 · 39 semaian nyata</span>
              <span className="text-xs text-white/50">Skor prediksi · makin pendek makin tahan · Jacquotte dkk. 2026 (CC0)</span>
            </span>
            <span className="flex gap-3.5 text-[11.5px] font-semibold text-white/70">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px] bg-[#9D7BFF]" /> simpan ({seedlingKeep})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px] bg-white/20" /> lepas ({seedlingScores.length - seedlingKeep})
              </span>
            </span>
          </div>
          <div className="flex flex-1 items-end gap-[5px] pt-2">
            {seedlingScores.map((s, i) => (
              <div
                key={i}
                title={`#${i + 1} · skor ${s.toFixed(1).replace('.', ',')}`}
                className={cx('min-w-0 flex-1 rounded-t-[5px] rounded-b-[2px] transition hover:opacity-80', i >= seedlingKeep && 'bg-white/15')}
                style={{ height: `${(s / maxScore) * 100}%`, background: i < seedlingKeep ? 'linear-gradient(#B9A2FF, #7B4DFF)' : undefined }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="font-bold text-[#CDBBFF]">#1 · PA-51×ICS-95-38 · skor 7,7</span>
            <span className="text-white/40">#39 · skor 28,4</span>
          </div>
          <p className="text-[11px] text-white/40">Keluarga ini ikut data latih, jadi urutan di sini lebih optimistis daripada pada silangan baru.</p>
        </div>
      </Dark>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_330px]">
        <ModelCard
          icon={GitFork}
          title="Pohon tak dikenal: dari mana asalnya?"
          sub="SIM-019 · diklaim TSH1188 · KE Kolaka"
          tag={<span className="shrink-0 rounded-full bg-bean-soft px-2.5 py-0.5 text-[10.5px] font-extrabold text-bean">TIDAK DIKENAL</span>}
          action={{ icon: ScanSearch, label: 'Minta uji genome-wide (uji refleks)' }}
        >
          <div className="rounded-2xl bg-cream p-3.5">
            <Overline className="text-[10px]">Kemungkinan tumbuh dari biji</Overline>
            <p className="mt-1 font-display text-[22px] font-bold tracking-tight">ICS95 × CCN51</p>
            <p className="text-[11.5px] leading-relaxed text-body">Dua klon di kebun yang sama · 1 eksklusi dari 46 SNP (wajar ≤ 5) · uji Mendel, bukan AI</p>
          </div>
          <Overline className="text-[10px]">Latar genetik · model AI</Overline>
          <div className="flex h-3.5 gap-0.5">
            {ancestry.map((a) => (
              <span key={a.name} className="rounded" style={{ flex: `${a.share} 1 0`, background: a.color }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {ancestry.map((a) => (
              <span key={a.name} className="flex items-center gap-1.5 text-[11px] font-semibold text-body">
                <span className="size-2 rounded-[2px]" style={{ background: a.color }} />
                {a.name} {Math.round(a.share * 100)}%
              </span>
            ))}
          </div>
        </ModelCard>

        <ModelCard
          icon={Wheat}
          title="Semaian dengan biji terbanyak"
          sub="TSH1188 × SCA6 · 30 semaian simulasi · prediksi biji per buah"
          tag={<span className="shrink-0 rounded-full bg-warn-soft px-2.5 py-0.5 text-[10.5px] font-extrabold text-warn">SIMULASI</span>}
          action={{ icon: Shuffle, label: 'Buat 30 semaian & ranking ulang' }}
        >
          <ol className="space-y-2.5">
            {crossSeedlings.map((c, i) => (
              <li key={c.name} className="flex items-center gap-2.5 text-[12.5px]">
                <span className="w-6 font-extrabold text-bean">#{i + 1}</span>
                <span className="w-[84px] font-semibold">{c.name}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-bean-soft">
                  <span className="block h-full rounded-full bg-bean" style={{ width: `${((c.beans - 36) / 9) * 100}%` }} />
                </span>
                <b className="w-9 text-right">{c.beans.toFixed(1).replace('.', ',')}</b>
              </li>
            ))}
          </ol>
          <p className="border-t border-line pt-2 text-[11.5px] text-mute">Tetua: TSH1188 39,4 · SCA6 44,3 biji per buah</p>
        </ModelCard>

        <Dark className="flex flex-col gap-3 rounded-[22px] p-[22px]">
          <div>
            <h2 className="font-display text-[17px] font-bold">Batas yang kami tulis terang</h2>
            <p className="text-[11.5px] text-white/50">Tiap model dipakai hanya untuk yang lolos uji</p>
          </div>
          {modelLimits.map((m) => (
            <div key={m.name} className="space-y-1.5 rounded-[14px] bg-white/5 p-3">
              <p className="text-[13px] font-bold">{m.name}</p>
              <p className="flex items-center gap-1.5 text-[11.5px] text-white/70">
                <Check size={13} className="text-mint" /> {m.ok}
              </p>
              <p className="flex items-center gap-1.5 text-[11.5px] text-white/70">
                {m.warnOnly ? <TriangleAlert size={13} className="text-[#FFC24B]" /> : <X size={13} className="text-[#FF8F92]" />} {m.no}
              </p>
            </div>
          ))}
        </Dark>
      </div>
    </>
  )
}
