import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Hourglass, Leaf, Pencil, Plus, Smartphone, X } from 'lucide-react'
import { get, post, put, type Clone, type Provider, type Risk } from '../lib/api'
import { searchClones } from '../lib/field'
import { TopBar } from '../components/TopBar'
import { Card, Dark, Empty, Loading, Overline, Problem, cx } from '../components/ui'

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

  // Global search links to #kebun-<id>.
  useEffect(() => {
    if (hash && providers.data) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [hash, providers.data])

  const byName = new Map(risk.data?.map((r) => [r.provider, r]))
  const status = new Map(clones.data?.map((c) => [c.name, c.status]))
  const planned = risk.data ?? []
  const total = planned.reduce((n, r) => n + r.recommended_n, 0)
  const scale = Math.max(60, ...planned.map((r) => r.recommended_n))
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
        primary={{ icon: Smartphone, label: 'Lihat anjuran di ponsel', to: '/m' }}
      />

      {adding && <ProviderForm names={clones.data?.map((c) => c.name) ?? []} onDone={saved} onCancel={() => setAdding(false)} />}

      {risk.isError ? (
        <Problem what="Skor risiko" error={risk.error} className="mt-6" />
      ) : !risk.data ? (
        <Loading className="mt-6" />
      ) : planned.length > 0 ? (
        <Dark glows={[['#3DDC97', '20% 0%', '100% 160%']]} className="mt-6 grid items-center gap-9 p-7 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.1em] text-mint">ANJURAN SAMPLING BERIKUTNYA</p>
            <div className="mt-2 flex items-end gap-3">
              <span className="font-display text-[76px] leading-[0.9] font-bold tracking-[-0.04em]">{total}</span>
              <span className="pb-1.5 text-[15px] leading-tight font-semibold text-white/70">
                daun dari
                <br />
                {planned.length} kebun
              </span>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-white/55">
              Kebun dengan riwayat buruk diambil lebih banyak. Skor = aturan terbuka + penghalusan Bayes, bukan AI.
            </p>
          </div>
          <div className="space-y-3">
            {planned.map((r) => (
              <div key={r.provider} className="flex items-center gap-3.5">
                <span className="w-28 shrink-0 truncate text-[13px] font-bold">{short(r.provider)}</span>
                <div className="h-[22px] flex-1 overflow-hidden rounded-[7px] bg-white/[0.07]">
                  <div
                    className="h-full rounded-[7px]"
                    style={{
                      width: `${(r.recommended_n / scale) * 100}%`,
                      background: r.tier === 'Tinggi' ? 'linear-gradient(90deg, #FF8A3D, #FF5A5F)' : 'linear-gradient(90deg, #3DDC97, #2BD37A)',
                    }}
                  />
                </div>
                <span className="w-16 text-right text-[13px] font-extrabold">{r.recommended_n} daun</span>
              </div>
            ))}
          </div>
        </Dark>
      ) : null}

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
                    {r && (
                      <span className="flex items-center gap-1.5 text-[13px] font-extrabold text-mint-deep">
                        <Leaf size={14} /> Ambil {r.recommended_n} daun
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}

// Garden clones must be registry entries, so seed-origin tests can use them (API rejects unknown names).
function ClonesInput({ value, onChange, names }: { value: string[]; onChange: (v: string[]) => void; names: string[] }) {
  const [q, setQ] = useState('')
  const options = q.trim() ? searchClones(names, q, [], 6).filter((n) => !value.includes(n)) : []
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((c) => (
          <span key={c} className="flex items-center gap-1 rounded-lg bg-cream py-1 pr-1 pl-2 text-[11.5px] font-bold">
            {c}
            <button type="button" aria-label={`Hapus ${c}`} onClick={() => onChange(value.filter((x) => x !== c))} className="grid size-4 place-items-center rounded text-mute hover:bg-line">
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari klon di registri…" className={input} />
        {options.length > 0 && (
          <ul className="absolute inset-x-0 z-10 mt-1 rounded-xl border border-line bg-white p-1 shadow-lg">
            {options.map((n) => (
              <li key={n}>
                <button
                  type="button"
                  onClick={() => {
                    onChange([...value, n])
                    setQ('')
                  }}
                  className="w-full rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold hover:bg-cream"
                >
                  {n}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
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
