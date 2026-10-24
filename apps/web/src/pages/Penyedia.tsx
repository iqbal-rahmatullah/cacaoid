import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck, CalendarClock, Check, Hourglass, Leaf, Pencil, Plus, Send, X } from 'lucide-react'
import { get, post, put, type Clone, type Plan, type Provider, type Risk, type Task } from '../lib/api'
import { dueLabel, monthChoices, taskTitle, todayIso } from '../lib/field'
import { ClonesInput } from '../components/ClonesInput'
import { TopBar } from '../components/TopBar'
import { Card, CardHead, Dark, Empty, Loading, Meter, Overline, Problem, cx } from '../components/ui'

const input = 'w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] font-semibold outline-none focus:border-mint-deep'
const short = (name: string) => name.replace('KE Simulasi ', '')

export default function Penyedia() {
  const qc = useQueryClient()
  const { hash } = useLocation()
  const risk = useQuery({ queryKey: ['risk'], queryFn: () => get<Risk[]>('/ai/risk') })
  const providers = useQuery({ queryKey: ['providers'], queryFn: () => get<Provider[]>('/providers') })
  const clones = useQuery({ queryKey: ['clones'], queryFn: () => get<Clone[]>('/clones') })
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [planning, setPlanning] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [month, setMonth] = useState(() => monthChoices(new Date())[0].value)

  // Global search links to #kebun-<id>.
  useEffect(() => {
    if (hash && providers.data) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [hash, providers.data])

  const byName = new Map(risk.data?.map((r) => [r.provider, r]))
  const status = new Map(clones.data?.map((c) => [c.name, c.status]))
  const saved = () => {
    qc.invalidateQueries({ queryKey: ['providers'] })
    setAdding(false)
    setEditing(null)
  }

  return (
    <>
      <TopBar
        crumb={['Data', 'Penyedia & kebun']}
        title="Penyedia & kebun entres"
        sub={`${providers.data?.length ?? '…'} penyedia terdaftar · jumlah daun yang diambil mengikuti riwayat tiap kebun`}
        secondary={{ icon: Plus, label: 'Daftarkan penyedia', onClick: () => setAdding(true) }}
        primary={{ icon: CalendarCheck, label: 'Kirim rencana sampling', onClick: () => setPlanning(true) }}
      />

      {adding && <ProviderForm names={clones.data?.map((c) => c.name) ?? []} onDone={saved} onCancel={() => setAdding(false)} />}

      {planning && <PlanForm onDone={(m) => { setMonth(m); setPlanning(false) }} onCancel={() => setPlanning(false)} />}

      {risk.isError ? (
        <Problem what="Skor risiko" error={risk.error} className="mt-6" />
      ) : !risk.data ? (
        <Loading className="mt-6" />
      ) : (
        <SamplingHero risk={risk.data} month={month} onMonth={setMonth} onPlan={() => setPlanning(true)} />
      )}

      {providers.isError ? (
        <Problem what="Daftar penyedia" error={providers.error} className="mt-5" />
      ) : !providers.data ? null : providers.data.length === 0 ? (
        <Empty className="mt-5">Belum ada penyedia. Daftarkan kebun entres beserta klon yang ditanam di sana.</Empty>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {providers.data.map((p) => {
            const r = byName.get(p.name)
            const high = r?.tier === 'Tinggi'
            const pending = p.clones.filter((c) => status.get(c) && status.get(c) !== 'referensi')
            return (
              <Card key={p.id} id={`kebun-${p.id}`} className={cx('flex gap-5 p-[22px]', hash === `#kebun-${p.id}` && 'ring-2 ring-mint-deep')}>
                <div
                  className="relative grid size-28 shrink-0 place-items-center rounded-full"
                  style={{ background: r ? `conic-gradient(${high ? '#E5484D' : '#FF8A3D'} ${r.score * 3.6}deg, #F6F0E8 0)` : '#F6F0E8' }}
                >
                  <div className="grid size-[90px] place-items-center rounded-full bg-white text-center">
                    <span>
                      <span className="block font-display text-[32px] leading-none font-bold tracking-tight">{r?.score ?? '—'}</span>
                      <span className="text-[10.5px] text-mute">{r ? 'dari 100' : 'belum ada riwayat'}</span>
                    </span>
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block font-display text-[17px] font-bold">{p.name}</span>
                      <span className="text-xs text-mute">
                        {[p.regency, p.province].filter(Boolean).join(', ') || p.kind}
                        {r && ` · bermasalah ${r.bad}/${r.n}`}
                      </span>
                    </span>
                    {r && (
                      <span className={cx('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold', high ? 'bg-bad-soft text-bad' : 'bg-pod-soft text-[#C2560F]')}>
                        Risiko {r.tier.toLowerCase()}
                      </span>
                    )}
                  </div>
                  {r?.factors.map((f) => (
                    <div key={f.label} className="flex items-center gap-2 text-xs text-body">
                      <span className="rounded-[7px] bg-cream px-1.5 py-0.5 text-[11px] font-extrabold">+{f.points}</span>
                      {f.label}
                    </div>
                  ))}
                  <div className="pt-1">
                    <div className="flex items-center justify-between">
                      <Overline className="text-[10px]">Klon terdaftar di kebun</Overline>
                      {editing !== p.id && (
                        <button type="button" onClick={() => setEditing(p.id)} className="flex items-center gap-1 text-[11.5px] font-bold text-mint-deep hover:underline">
                          <Pencil size={12} /> Ubah
                        </button>
                      )}
                    </div>
                    {editing === p.id ? (
                      <GardenEditor provider={p} names={clones.data?.map((c) => c.name) ?? []} onDone={saved} onCancel={() => setEditing(null)} />
                    ) : (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {p.clones.length ? (
                          p.clones.map((c) => (
                            <span key={c} className="rounded-lg bg-cream px-2 py-1 text-[11px] font-bold text-body">
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11.5px] text-mute">Belum ada. Asal biji tidak bisa diuji sebelum klon kebun didaftarkan.</span>
                        )}
                      </div>
                    )}
                    {pending.length > 0 && editing !== p.id && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-info">
                        <Hourglass size={12} /> {pending.join(', ')} belum punya sidik jari referensi
                      </p>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-line pt-2.5">
                    <span className="text-xs text-mute">
                      {p.clones.length} klon · {p.source}
                    </span>
                    <span className="flex items-center gap-3">
                      {r && (
                        <span className="flex items-center gap-1.5 text-[13px] font-extrabold text-mint-deep">
                          <Leaf size={14} /> Ambil {r.recommended_n} daun
                        </span>
                      )}
                      {assigning !== p.name && (
                        <button type="button" onClick={() => setAssigning(p.name)} className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11.5px] font-bold hover:bg-cream">
                          <Send size={12} /> Kirim tugas
                        </button>
                      )}
                    </span>
                  </div>
                  {assigning === p.name && <TaskForm provider={p.name} suggested={r?.recommended_n ?? 10} onDone={() => setAssigning(null)} />}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <TaskList />
    </>
  )
}

const monthLabel = (m: string) => monthChoices(new Date(`${m}-01T00:00:00Z`))[0].label

// Plan for the chosen month when one was sent; otherwise the risk-based advice with a button to send it.
function SamplingHero({ risk, month, onMonth, onPlan }: { risk: Risk[]; month: string; onMonth: (m: string) => void; onPlan: () => void }) {
  const plan = useQuery({ queryKey: ['plan', month], queryFn: () => get<Plan>(`/plans/${month}`) })
  const choices = monthChoices(new Date())
  const sent = !!plan.data?.tasks.length
  const rows = sent
    ? plan.data!.tasks.map((t) => ({ key: t.provider, target: t.target, done: Math.min(t.done, t.target), tier: risk.find((r) => r.provider === t.provider)?.tier }))
    : risk.map((r) => ({ key: r.provider, target: r.recommended_n, done: 0, tier: r.tier }))
  const total = rows.reduce((n, r) => n + r.target, 0)
  const scale = Math.max(60, ...rows.map((r) => r.target))
  if (!rows.length) return null
  return (
    <Dark glows={[['#3DDC97', '20% 0%', '100% 160%']]} className="mt-6 grid items-center gap-9 p-7 xl:grid-cols-[340px_minmax(0,1fr)]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-extrabold tracking-[0.1em] text-mint">{sent ? `RENCANA SAMPLING · ${monthLabel(month).toUpperCase()}` : 'ANJURAN SAMPLING BERIKUTNYA'}</p>
          <span className="flex gap-1 rounded-full bg-white/10 p-0.5 text-[10.5px] font-bold">
            {choices.map((c) => (
              <button key={c.value} type="button" onClick={() => onMonth(c.value)} className={cx('rounded-full px-2 py-0.5', c.value === month ? 'bg-white text-choc' : 'text-white/60')}>
                {c.label.split(' ')[0].slice(0, 3)}
              </button>
            ))}
          </span>
        </div>
        <div className="mt-2 flex items-end gap-3">
          <span className="font-display text-[76px] leading-[0.9] font-bold tracking-[-0.04em]">{sent ? plan.data!.done : total}</span>
          <span className="pb-1.5 text-[15px] leading-tight font-semibold text-white/70">
            {sent ? 'daun terkumpul' : 'daun dari'}
            <br />
            {sent ? `dari ${total} · ${rows.length} kebun` : `${rows.length} kebun`}
          </span>
        </div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-white/55">
          Kebun dengan riwayat buruk diambil lebih banyak. Skor = aturan terbuka + penghalusan Bayes, bukan AI.
        </p>
        {!sent && (
          <button type="button" onClick={onPlan} className="mt-3 flex items-center gap-2 rounded-full bg-mint px-4 py-2 text-[12.5px] font-extrabold text-choc">
            <Send size={14} /> Kirim sebagai rencana {monthLabel(month)}
          </button>
        )}
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-3.5">
            <span className="w-28 shrink-0 truncate text-[13px] font-bold">{short(r.key)}</span>
            <div className="relative h-[22px] flex-1 overflow-hidden rounded-[7px] bg-white/[0.07]">
              <div className="h-full rounded-[7px] bg-white/10" style={{ width: `${(r.target / scale) * 100}%` }} />
              <div
                className="absolute inset-y-0 left-0 rounded-[7px]"
                style={{
                  width: `${((sent ? r.done : r.target) / scale) * 100}%`,
                  background: r.tier === 'Tinggi' ? 'linear-gradient(90deg, #FF8A3D, #FF5A5F)' : 'linear-gradient(90deg, #3DDC97, #2BD37A)',
                }}
              />
            </div>
            <span className="w-16 text-right text-[13px] font-extrabold">{sent ? `${r.done}/${r.target}` : `${r.target} daun`}</span>
          </div>
        ))}
      </div>
    </Dark>
  )
}

function PlanForm({ onDone, onCancel }: { onDone: (month: string) => void; onCancel: () => void }) {
  const qc = useQueryClient()
  const choices = monthChoices(new Date())
  const [month, setMonth] = useState(choices[0].value)
  const [officer, setOfficer] = useState('')
  const send = useMutation({
    mutationFn: () => post<Plan>('/plans', { month, officer }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      onDone(month)
    },
  })
  return (
    <Card className="mt-6 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Kirim rencana sampling ke ponsel</h2>
          <p className="text-xs text-mute">Satu tugas per kebun, jumlah daun mengikuti skor risiko. Kebun yang sudah punya rencana bulan itu tidak digandakan.</p>
        </div>
        <button type="button" aria-label="Tutup" onClick={onCancel} className="grid size-8 place-items-center rounded-full hover:bg-cream">
          <X size={16} />
        </button>
      </div>
      <div className="grid gap-3 text-xs font-bold text-body sm:grid-cols-[200px_minmax(0,1fr)_auto] sm:items-end">
        <label className="space-y-1.5">
          Bulan
          <select value={month} onChange={(e) => setMonth(e.target.value)} className={input}>
            {choices.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          Pengawas <span className="font-semibold text-mute">(kosongkan = semua pengawas)</span>
          <input value={officer} onChange={(e) => setOfficer(e.target.value)} placeholder="mis. Pengawas 3" className={input} />
        </label>
        <button type="button" onClick={() => send.mutate()} disabled={send.isPending} className="flex items-center gap-2 rounded-full bg-choc px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-50">
          <Send size={14} className="text-mint" /> Kirim
        </button>
      </div>
      {send.error && <Problem what="Rencana" verb="dikirim" error={send.error} />}
    </Card>
  )
}

function TaskForm({ provider, suggested, onDone }: { provider: string; suggested: number; onDone: () => void }) {
  const qc = useQueryClient()
  const inWeek = todayIso(new Date(Date.now() + 7 * 86_400_000))
  const [f, setF] = useState({ officer: '', target: String(suggested), due: inWeek, note: '' })
  const send = useMutation({
    mutationFn: () => post<Task>('/tasks', { ...f, provider, target: Number(f.target) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      onDone()
    },
  })
  return (
    <form
      className="grid gap-2 rounded-xl bg-cream/60 p-3 text-[11.5px] font-bold text-body sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault()
        send.mutate()
      }}
    >
      <label className="space-y-1">
        Pengawas
        <input value={f.officer} onChange={(e) => setF({ ...f, officer: e.target.value })} placeholder="semua" className={input} />
      </label>
      <label className="space-y-1">
        Jumlah daun
        <input type="number" min={1} max={500} required value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} className={input} />
      </label>
      <label className="space-y-1">
        Tenggat
        <input type="date" required min={todayIso()} value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} className={input} />
      </label>
      <input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Catatan untuk pengawas (opsional)" className={cx(input, 'sm:col-span-3')} />
      {send.error && <Problem what="Tugas" verb="dikirim" error={send.error} className="sm:col-span-3" />}
      <div className="flex gap-2 sm:col-span-3">
        <button type="submit" disabled={send.isPending} className="flex items-center gap-1.5 rounded-full bg-choc px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-50">
          <Send size={13} className="text-mint" /> Kirim ke ponsel
        </button>
        <button type="button" onClick={onDone} className="rounded-full border border-line bg-white px-4 py-2 text-[12.5px] font-bold">
          Batal
        </button>
      </div>
    </form>
  )
}

function TaskList() {
  const qc = useQueryClient()
  const tasks = useQuery({ queryKey: ['tasks', 'semua'], queryFn: () => get<Task[]>('/tasks') })
  const close = useMutation({ mutationFn: (id: number) => post<Task>(`/tasks/${id}/done`, {}), onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }) })
  return (
    <Card className="mt-5">
      <CardHead title="Tugas lapangan" sub="Terkirim ke ponsel pengawas · progres dihitung dari sampel yang masuk" />
      {tasks.isError ? (
        <Problem what="Tugas" error={tasks.error} className="mt-4" />
      ) : !tasks.data ? (
        <p className="mt-4 text-[13px] text-mute">Memuat…</p>
      ) : !tasks.data.length ? (
        <Empty className="mt-4">Belum ada tugas. Kirim rencana sampling atau tugas per kebun.</Empty>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {tasks.data.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 py-3">
              <CalendarClock size={18} className={cx('shrink-0', t.status === 'terlambat' ? 'text-bad' : t.status === 'selesai' ? 'text-ok' : 'text-mint-deep')} />
              <span className="min-w-0 flex-1 basis-60">
                <span className="block truncate text-[13px] font-bold">{taskTitle(t)}</span>
                <span className="text-[11.5px] text-mute">
                  {t.officer || 'semua pengawas'} · {t.status === 'selesai' ? 'selesai' : dueLabel(t.due, todayIso())}
                </span>
              </span>
              <span className="flex w-40 items-center gap-2">
                <Meter value={Math.min(t.done, t.target)} max={t.target} fill={t.status === 'selesai' ? 'bg-ok' : 'bg-mint-deep'} className="h-1.5 flex-1" />
                <b className="w-14 text-right text-[12.5px]">
                  {t.done}/{t.target}
                </b>
              </span>
              {t.status !== 'selesai' ? (
                <button type="button" onClick={() => close.mutate(t.id)} disabled={close.isPending} className="rounded-full border border-line px-3 py-1 text-[11.5px] font-bold hover:bg-cream">
                  Tandai selesai
                </button>
              ) : (
                <Check size={16} className="text-ok" />
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function GardenEditor({ provider, names, onDone, onCancel }: { provider: Provider; names: string[]; onDone: () => void; onCancel: () => void }) {
  const [value, setValue] = useState(provider.clones)
  const save = useMutation({ mutationFn: () => put<Provider>(`/providers/${provider.id}/clones`, value), onSuccess: onDone })
  return (
    <div className="mt-2 space-y-2.5 rounded-xl bg-cream/60 p-3">
      <ClonesInput value={value} onChange={setValue} names={names} />
      {save.error && <Problem what="Klon kebun" verb="disimpan" error={save.error} />}
      <div className="flex gap-2">
        <button type="button" onClick={() => save.mutate()} disabled={save.isPending} className="rounded-full bg-choc px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-50">
          Simpan
        </button>
        <button type="button" onClick={onCancel} className="rounded-full border border-line bg-white px-4 py-2 text-[12.5px] font-bold">
          Batal
        </button>
      </div>
    </div>
  )
}

function ProviderForm({ names, onDone, onCancel }: { names: string[]; onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState({ name: '', kind: 'kebun entres', province: '', regency: '' })
  const [garden, setGarden] = useState<string[]>([])
  const save = useMutation({ mutationFn: () => post<Provider>('/providers', { ...f, clones: garden }), onSuccess: onDone })
  return (
    <Card className="mt-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Daftarkan penyedia</h2>
          <p className="text-xs text-mute">Klon yang ditanam di kebun dipakai untuk menguji asal biji dan bibit dari kebun ini.</p>
        </div>
        <button type="button" aria-label="Tutup" onClick={onCancel} className="grid size-8 place-items-center rounded-full hover:bg-cream">
          <X size={16} />
        </button>
      </div>
      <form
        className="grid gap-3 text-xs font-bold text-body sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
      >
        <label className="space-y-1.5">
          Nama penyedia
          <input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="KE Sumber Rejeki" className={input} />
        </label>
        <label className="space-y-1.5">
          Jenis
          <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className={input}>
            {['kebun entres', 'kebun benih', 'penangkar'].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          Provinsi
          <input value={f.province} onChange={(e) => setF({ ...f, province: e.target.value })} placeholder="Sulawesi Selatan" className={input} />
        </label>
        <label className="space-y-1.5">
          Kabupaten
          <input value={f.regency} onChange={(e) => setF({ ...f, regency: e.target.value })} placeholder="Luwu Utara" className={input} />
        </label>
        <div className="space-y-1.5 sm:col-span-2">
          Klon yang ditanam
          <ClonesInput value={garden} onChange={setGarden} names={names} />
        </div>
        {save.error && <Problem what="Penyedia" verb="didaftarkan" error={save.error} className="sm:col-span-2" />}
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" disabled={save.isPending || !f.name.trim()} className="rounded-full bg-choc px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-50">
            Daftarkan
          </button>
          <button type="button" onClick={onCancel} className="rounded-full border border-line bg-white px-5 py-2.5 text-[13px] font-bold">
            Batal
          </button>
        </div>
      </form>
    </Card>
  )
}
