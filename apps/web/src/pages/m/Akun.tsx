import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  BookOpen,
  ChevronRight,
  CloudOff,
  Info,
  ListChecks,
  LogOut,
  Monitor,
  RefreshCw,
  Wifi,
} from "lucide-react"
import type { Verdict } from "../../data/demo"
import { CHECKS, KINDS, initials } from "../../lib/field"
import { remember, useSampleQueue } from "../../lib/useSampleQueue"
import { Dark, SimBadge, VerdictPill } from "../../components/ui"

const MEANING: [Verdict, string][] = [
  [
    "COCOK",
    "DNA sama dengan klon yang diklaim; beda masih dalam batas error lab.",
  ],
  [
    "OFF-TYPE",
    "Bukan klon yang diklaim. Bila ada, klon yang cocok disebutkan.",
  ],
  ["BATANG BAWAH", "Daun berasal dari tunas batang bawah, bukan batang atas."],
  [
    "TIDAK DIKENAL",
    "Tidak cocok dengan klon mana pun di registri; diusulkan uji lanjutan.",
  ],
  [
    "BELUM ADA REFERENSI",
    "Klon yang diklaim belum punya sidik jari di registri.",
  ],
  ["UJI ULANG", "Data lab belum cukup (DNA terbaca < 85%); ulangi genotyping."],
  ["SESUAI SILANGAN", "Bibit hibrida memang anak silangan yang diklaim."],
  [
    "KONTAMINAN",
    "Bibit hibrida bukan anak silangan yang diklaim (serbuk sari liar).",
  ],
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className='space-y-2'>
      <h2 className='px-1 text-[10.5px] font-extrabold tracking-[0.1em] text-mute uppercase'>
        {title}
      </h2>
      <div className='rounded-[20px] border border-line bg-white px-4'>
        {children}
      </div>
    </section>
  )
}

// Static for now: no login yet (ROADMAP Fase 3), so the profile is the device's remembered officer.
export default function Akun() {
  const queue = useSampleQueue()
  const officer = remember("officer")

  return (
    <div className='space-y-5 pt-1'>
      <div className='flex items-center justify-between'>
        <h1 className='font-display text-xl font-bold tracking-tight'>Akun</h1>
        <SimBadge />
      </div>

      <Dark
        glows={[
          ["#3DDC97", "100% 0%", "160% 140%"],
          ["#FF8A3D", "0% 100%", "120% 120%"],
        ]}
        className='rounded-[28px] p-[22px]'
      >
        <div className='flex items-center gap-3.5'>
          <span className='grid size-14 shrink-0 place-items-center rounded-full bg-pod font-display text-lg font-bold text-choc'>
            {initials(officer)}
          </span>
          <span className='min-w-0'>
            <span className='block truncate font-display text-[22px] leading-tight font-bold'>
              {officer || "Pengawas benih"}
            </span>
            <span className='block text-[12.5px] text-white/60'>
              {officer
                ? "Pengawas benih · UPTD BPSBP Sulsel"
                : "UPTD BPSBP Sulsel · isi nama di Ambil sampel"}
            </span>
          </span>
        </div>
      </Dark>

      <Section title='Sinkronisasi'>
        <div className='flex items-center gap-3 py-3'>
          {queue.online ? (
            <Wifi size={17} className='text-ok' />
          ) : (
            <CloudOff size={17} className='text-warn' />
          )}
          <span className='flex-1'>
            <span className='block text-[13px] font-semibold'>
              {queue.online ? "Ada sinyal" : "Tanpa sinyal"}
            </span>
            <span className='text-[12px] text-mute'>
              {queue.pending
                ? `${queue.pending} sampel menunggu dikirim`
                : "Semua sampel sudah terkirim"}
            </span>
          </span>
          {queue.online && queue.pending > 0 && (
            <button
              type='button'
              onClick={queue.sync}
              className='flex items-center gap-1.5 rounded-full bg-mint-soft px-3 py-1.5 text-[12px] font-bold text-mint-deep'
            >
              <RefreshCw size={14} /> Kirim
            </button>
          )}
        </div>
      </Section>

      <Section title='Bantuan'>
        <details className='group border-b border-line py-3'>
          <summary className='flex cursor-pointer list-none items-center gap-3 text-[13px] font-semibold'>
            <ListChecks size={17} className='text-mute' />{" "}
            <span className='flex-1'>Prosedur ambil daun</span>
            <ChevronRight
              size={16}
              className='text-mute transition group-open:rotate-90'
            />
          </summary>
          <div className='mt-3 space-y-3'>
            {KINDS.map((k) => (
              <div key={k.value}>
                <p className='text-[12px] font-bold'>{k.label}</p>
                <ul className='mt-1 list-disc space-y-0.5 pl-5 text-[12px] text-body'>
                  {CHECKS[k.value].map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
        <details className='group border-b border-line py-3'>
          <summary className='flex cursor-pointer list-none items-center gap-3 text-[13px] font-semibold'>
            <BookOpen size={17} className='text-mute' />{" "}
            <span className='flex-1'>Arti tiap vonis</span>
            <ChevronRight
              size={16}
              className='text-mute transition group-open:rotate-90'
            />
          </summary>
          <dl className='mt-3 space-y-2.5'>
            {MEANING.map(([v, text]) => (
              <div key={v}>
                <dt>
                  <VerdictPill v={v} />
                </dt>
                <dd className='mt-1 text-[12px] text-body'>{text}</dd>
              </div>
            ))}
          </dl>
        </details>
        <div className='flex items-start gap-3 py-3'>
          <Info size={17} className='mt-px shrink-0 text-mute' />
          <span className='text-[12px] text-body'>CacaoID versi 0.1</span>
        </div>
      </Section>

      <div className='space-y-2.5'>
        <Link
          to='/'
          className='flex items-center justify-center gap-2 rounded-full border border-line bg-white py-3.5 text-[13.5px] font-bold'
        >
          <Monitor size={16} /> Buka aplikasi web
        </Link>
        <button
          type='button'
          disabled
          className='flex w-full items-center justify-center gap-2 rounded-full bg-line py-3.5 text-[13.5px] font-bold text-mute'
        >
          <LogOut size={16} /> Keluar
        </button>
        <p className='text-center text-[11.5px] text-mute'>
          Login dan keluar menyusul bersama akun pengawas (Fase 3).
        </p>
      </div>
    </div>
  )
}
