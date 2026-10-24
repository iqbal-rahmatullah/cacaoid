import { BadgeCheck, Download, FileDown, Link as LinkIcon, Map as MapIcon, MapPin, Printer, QrCode, Sheet, Sprout, Trees } from 'lucide-react'
import { audit, batch, verdictCounts } from '../data/demo'
import { Card, Dark, IconTile, TopBar, VERDICT } from '../components/ui'

const PASSPORT = [
  { icon: BadgeCheck, label: 'Identitas klon', value: 'COCOK · ICS60', tone: 'text-mint' },
  { icon: Trees, label: 'Risiko deforestasi (EUDR)', value: 'RENDAH', tone: 'text-mint' },
  { icon: MapPin, label: 'Titik tanam', value: '−2,5475 · 120,3582', tone: 'text-white' },
]

const EXPORTS = [
  { icon: MapIcon, label: 'GeoJSON EUDR', detail: 'Titik tanam bibit terverifikasi' },
  { icon: Sheet, label: 'CSV hasil', detail: '135 vonis + bukti per SNP' },
]

const FOLLOW_UP = [
  ['SIM-065', 'OFF-TYPE · label MCC 01, DNA Sulawesi 1 · ganti pohon induk sebelum entres diambil'],
  ['LOT-H-07', 'TAHAN · 12/60 bibit kontaminan (16%) · lot tidak disalurkan'],
  ['SIM-071', 'BATANG BAWAH · tunas batang bawah · sambung ulang'],
]

export default function Laporan() {
  return (
    <>
      <TopBar
        crumb={['AI & laporan', 'Laporan']}
        title="Berita acara verifikasi"
        sub={`${batch.name} · siap ditandatangani pengawas benih & kepala UPTD`}
        secondary={{ icon: Printer, label: 'Cetak' }}
        primary={{ icon: FileDown, label: 'Unduh PDF' }}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col rounded-[24px] bg-desk px-4 pt-7 sm:px-10">
          <article className="mx-auto flex min-h-[760px] w-full max-w-[720px] flex-1 flex-col gap-4 rounded-t-md bg-white px-6 py-8 text-[11px] shadow-[0_10px_30px_rgba(61,42,31,0.15)] sm:px-[38px]">
            <header className="flex items-start justify-between gap-4 border-b-2 border-ink pb-3.5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-[10px] bg-choc text-mint">
                  <Sprout size={18} />
                </span>
                <span>
                  <span className="block text-sm font-extrabold tracking-wide">BERITA ACARA VERIFIKASI BENIH KAKAO</span>
                  <span className="text-[10.5px] text-body">Verifikasi identitas klon berbasis sidik jari DNA (panel 48 SNP)</span>
                </span>
              </div>
              <span className="-rotate-4 rounded-md border-[1.5px] border-warn px-2.5 py-1 text-[10px] font-extrabold tracking-widest text-warn">DATA SIMULASI</span>
            </header>

            <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {[
                ['Batch', batch.name],
                ['Sampel', '135 + 2 kontrol'],
                ['Dianalisis', '23 Oktober 2026'],
                ['Kebun entres', '4 · Sulawesi'],
                ['File lab', batch.labFile],
                ['Kontrol plate', 'lolos'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="w-[86px] text-mute">{k}</dt>
                  <dd className="font-bold">{v}</dd>
                </div>
              ))}
            </dl>

            <h3 className="text-xs font-extrabold">1. Ringkasan vonis</h3>
            <div className="grid overflow-hidden rounded-md border border-line sm:grid-cols-2">
              {verdictCounts.map(([v, n]) => (
                <div key={v} className="flex items-center justify-between border-b border-line px-2.5 py-1.5 sm:odd:border-r">
                  <span className="flex items-center gap-1.5 text-[10.5px] font-bold text-body">
                    <span className="size-1.5 rounded-full" style={{ background: VERDICT[v].hex }} />
                    {v}
                  </span>
                  <b>{n}</b>
                </div>
              ))}
            </div>

            <h3 className="text-xs font-extrabold">2. Perlu tindak lanjut (28 sampel)</h3>
            {FOLLOW_UP.map(([id, t]) => (
              <p key={id} className="flex gap-2.5 text-[10.5px]">
                <b className="w-[70px] shrink-0 font-mono">{id}</b>
                <span className="text-body">{t}</span>
              </p>
            ))}

            <h3 className="text-xs font-extrabold">3. Dampak salah klon menurut uji lapang</h3>
            <p className="text-[10.5px] leading-relaxed text-body">
              Pohon SIM-065: petani membayar MCC 01 (3.672 kg/ha/thn) namun menerima Sulawesi 1 (2.772 kg/ha/thn), −25% pada uji lapang Susilo dkk. 2015 di Luwu Utara.
            </p>

            <footer className="mt-auto flex items-end gap-6 pt-10">
              {['Pengawas benih', 'Kepala UPTD BPSBP'].map((r) => (
                <div key={r} className="flex-1 border-t border-ink pt-1.5 text-[10.5px] font-bold">
                  {r}
                </div>
              ))}
              <div className="flex flex-col items-center gap-1">
                <span className="grid size-16 place-items-center rounded-lg border border-line">
                  <QrCode size={50} />
                </span>
                <span className="text-[9px] text-mute">cek keaslian</span>
              </div>
            </footer>
          </article>
        </div>

        <div className="flex flex-col gap-5">
          <Dark glows={[['#3DDC97', '100% 0%', '140% 120%']]} className="flex flex-col gap-3.5 p-[22px]">
            <div className="flex items-start justify-between">
              <span>
                <span className="block text-[10.5px] font-extrabold tracking-[0.12em] text-mint">PASPOR BIBIT</span>
                <span className="block font-mono text-xl font-bold">SIM-001</span>
                <span className="text-[11.5px] text-white/50">Pohon induk · KE Luwu Utara</span>
              </span>
              <span className="grid size-16 place-items-center rounded-xl bg-white text-choc">
                <QrCode size={48} />
              </span>
            </div>
            {PASSPORT.map(({ icon: Icon, label, value, tone }) => (
              <div key={label} className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2.5">
                <Icon size={16} className={tone} />
                <span>
                  <span className="block text-[11px] text-white/50">{label}</span>
                  <span className={`text-[13px] font-extrabold ${tone}`}>{value}</span>
                </span>
              </div>
            ))}
            <p className="text-[10.5px] leading-relaxed text-white/45">
              Bukan hutan pada 2020 (JRC) · tidak ada kehilangan tutupan setelah 2020 (Hansen). Alat skrining, bukan putusan.
            </p>
          </Dark>

          <Card className="px-[18px] pt-[18px] pb-2.5">
            <h2 className="font-display text-[17px] font-bold">Ekspor</h2>
            {EXPORTS.map(({ icon, label, detail }) => (
              <button key={label} type="button" className="flex w-full items-center gap-3 py-2.5 text-left">
                <IconTile icon={icon} size="sm" className="bg-cream text-body" />
                <span className="flex-1">
                  <span className="block text-[13px] font-bold">{label}</span>
                  <span className="text-[11.5px] text-mute">{detail}</span>
                </span>
                <Download size={16} className="text-mint-deep" />
              </button>
            ))}
          </Card>

          <Card className="flex-1 p-[18px]">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-bold">Jejak audit</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2.5 py-0.5 text-[10.5px] font-extrabold text-ok">
                <LinkIcon size={12} /> rantai hash utuh
              </span>
            </div>
            <ol className="mt-3 space-y-3">
              {audit.map((e) => (
                <li key={e.time} className="flex gap-2.5">
                  <span className="mt-1 size-[9px] shrink-0 rounded-full bg-mint-deep" />
                  <span className="flex-1">
                    <span className="block text-[12.5px] font-bold">{e.title}</span>
                    <span className="text-[11px] text-mute">{e.detail}</span>
                  </span>
                  <span className="font-mono text-[10.5px] text-mute">{e.time}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  )
}
