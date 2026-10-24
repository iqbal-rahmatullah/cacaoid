import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import { BadgeCheck, BookOpen, ChevronRight, CircleDashed, Dna, Hourglass, Plus, Search, Split, Sprout, Users, Warehouse, X } from 'lucide-react'
import { ApiError, get, post, type Clone, type CloneDetail, type Provider, type TraitCard } from '../lib/api'
import { readyFirst, statusRank } from '../lib/field'
import { num, paginate, parseProfile, toCells } from '../lib/results'
import { useCurrentBatch } from '../lib/useCurrentBatch'
import { TopBar } from '../components/TopBar'
import { Card, Empty, Fingerprint, IconTile, Loading, Overline, Pager, Problem, TONE, VerdictPill, cx } from '../components/ui'

const STATUS: Record<string, { label: string; note: string; tone: keyof typeof TONE; icon: LucideIcon }> = {
  referensi: { label: 'Referensi siap', note: 'Bisa dipakai untuk vonis', tone: 'ok', icon: BadgeCheck },
  'tidak lengkap': { label: 'Tidak lengkap', note: '< 85% SNP panel terisi', tone: 'warn', icon: CircleDashed },
  'tidak konsisten': { label: 'Tidak konsisten', note: 'Sumber saling bertentangan', tone: 'bad', icon: Split },
  'menunggu referensi': { label: 'Menunggu referensi', note: 'Pemilik klon belum kirim', tone: 'info', icon: Hourglass },
}
// Indonesian releases and the public genomes that stand in for them (apps/api db.py: PENDING + WGS_REFS).
const INDONESIA = ['Sulawesi 1', 'Sulawesi 2', 'MCC 01', 'MCC 02', 'M06', 'Clone 26 (Mars Sulawesi)', 'ICCRI 06H', 'ICCRI 08H']
const TABS = [
  ['id', 'Klon Indonesia'],
  ['all', 'Semua'],
  ['issue', 'Bermasalah'],
] as const
const PAGE = 10
const input = 'w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] font-semibold outline-none focus:border-mint-deep'
const fact = (v: string) => (/^-?\d+(\.\d+)?$/.test(v) ? num(Number(v)) : v)

export default function Registri() {
  const [params, setParams] = useSearchParams()
  const selected = params.get('klon') ?? 'Sulawesi 1'
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('id')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(false)
  const clones = useQuery({ queryKey: ['clones'], queryFn: () => get<Clone[]>('/clones') })
  const providers = useQuery({ queryKey: ['providers'], queryFn: () => get<Provider[]>('/providers') })
  const detail = useQuery({ queryKey: ['clone', selected], queryFn: () => get<CloneDetail>(`/clones/${encodeURIComponent(selected)}`) })
  const traits = useQuery({ queryKey: ['traits', selected], queryFn: () => get<TraitCard>(`/traits/clone/${encodeURIComponent(selected)}`) })
  const { batchId, batch } = useCurrentBatch()

  const all = clones.data ?? []
  const count = (s: string) => all.filter((c) => c.status === s).length
  const term = q.trim().toLowerCase()
  const matches = all
    .filter((c) => (tab === 'id' ? INDONESIA.includes(c.name) : tab === 'issue' ? c.status !== 'referensi' : true))
    .filter((c) => !term || c.name.toLowerCase().includes(term))
  // Valid references on top; the Indonesian tab keeps its own order within a status.
  const list =
    tab === 'id'
      ? matches.sort((a, b) => statusRank(a.status) - statusRank(b.status) || INDONESIA.indexOf(a.name) - INDONESIA.indexOf(b.name))
      : readyFirst(matches)
  const shown = paginate(list, page, PAGE)
  const pick = (name: string) => setParams({ klon: name })

  const c = detail.data
  const st = c ? (STATUS[c.status] ?? STATUS['menunggu referensi']) : null
  const cells = c ? toCells(c.panel.map((p) => ({ snp: p.snp, sample: p.call, claimed: null, found: null }))).sample : []
  const agree = c && /sepakat (\d+)\/(\d+) SNP \(([\d.]+)%\)/.exec(c.source)
  const seen = (batch.data?.samples ?? []).filter((s) => !s.is_control && s.verdict && (s.claim === selected || s.found_as === selected))
  const odd = seen.filter((s) => s.verdict !== 'COCOK').slice(0, 4)
  const gardens = (providers.data ?? []).filter((p) => p.clones.includes(selected))

  return (
    <>
      <TopBar
        crumb={['Data', 'Registri klon']}
        title="Registri klon"
        sub={`${all.length || '…'} sidik jari referensi · genom publik & bank gen · panel ${c?.panel.length ?? 48} SNP`}
        primary={{ icon: Plus, label: 'Tambah klon', onClick: () => setAdding(true) }}
      />

      {adding && (
        <CloneForm
          names={all.map((x) => x.name)}
          onDone={(name) => {
            setAdding(false)
            pick(name)
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {clones.isError ? (
        <Problem what="Registri" error={clones.error} className="mt-6" />
      ) : !clones.data ? (
        <Loading className="mt-6" />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
            {Object.entries(STATUS).map(([s, r]) => (
              <Card key={s} className="flex items-center gap-3.5 p-[18px]">
                <IconTile icon={r.icon} className={cx('size-11 rounded-[14px]', TONE[r.tone].soft, TONE[r.tone].text)} />
                <span>
                  <span className="block font-display text-[28px] leading-none font-bold tracking-tight">{count(s)}</span>
                  <span className="mt-1 block text-[12.5px] font-bold text-body">{r.label}</span>
                  <span className="block text-[11px] text-mute">{r.note}</span>
                </span>
              </Card>
            ))}
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[440px_minmax(0,1fr)]">
            <Card className="flex flex-col p-2.5 pt-[18px]">
              <div className="flex flex-wrap gap-1.5 px-2 pb-2 text-xs font-bold">
                {TABS.map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setTab(k)
                      setPage(1)
                    }}
                    className={cx('rounded-full px-3 py-1.5', tab === k ? 'bg-choc text-white' : 'bg-cream text-body')}
                  >
                    {l} {k === 'all' ? all.length : k === 'issue' ? all.length - count('referensi') : ''}
                  </button>
                ))}
              </div>
              <label className="mx-2 mb-2 flex items-center gap-2 rounded-xl border border-line px-3 py-2">
                <Search size={15} className="text-mute" />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Cari nama klon…"
                  className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-mute"
                />
              </label>
              <ul className="flex-1">
                {shown.rows.map((x) => {
                  const on = x.name === selected
                  const s = STATUS[x.status]
                  return (
                    <li key={x.name}>
                      <button
                        type="button"
                        onClick={() => pick(x.name)}
                        className={cx('flex w-full items-center gap-3 rounded-[14px] border px-3 py-[11px] text-left', on ? 'border-line bg-cream' : 'border-transparent hover:bg-cream/50')}
                      >
                        <IconTile icon={Dna} size="sm" className={on ? 'size-9 bg-choc text-mint' : 'size-9 bg-cream text-body'} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] font-bold">{x.name}</span>
                          <span className="block truncate text-[11.5px] text-mute">{x.source}</span>
                        </span>
                        <span className={cx('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold', s ? cx(TONE[s.tone].soft, TONE[s.tone].text) : 'bg-cream')}>
                          {x.status === 'referensi' ? 'Referensi' : x.status}
                        </span>
                      </button>
                    </li>
                  )
                })}
                {!list.length && <li className="px-3 py-4 text-center text-[13px] text-mute">Tidak ada klon yang cocok.</li>}
              </ul>
              {list.length > PAGE && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line px-2 pt-3">
                  <span className="text-[12px] text-mute">
                    {(shown.page - 1) * PAGE + 1}–{(shown.page - 1) * PAGE + shown.rows.length} dari {list.length} klon
                  </span>
                  <Pager page={shown.page} pages={shown.pages} onPage={setPage} />
                </div>
              )}
            </Card>

            {detail.isError ? (
              <Problem what={`Klon ${selected}`} error={detail.error} />
            ) : !c || !st ? (
              <Loading />
            ) : (
              <Card className="flex flex-col gap-[18px]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-[34px] leading-none font-bold tracking-tight">{c.name}</h2>
                    <p className="mt-2 max-w-xl text-[12.5px] text-body">{c.source}</p>
                  </div>
                  {agree && (
                    <div className="rounded-2xl bg-mint-soft px-4 py-3 text-right text-mint-deep">
                      <p className="font-display text-[26px] leading-none font-bold">{agree[3].replace('.', ',')}%</p>
                      <p className="mt-1 text-[11px] font-semibold">
                        sumber sepakat · {agree[1]}/{agree[2]} SNP
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                  <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1', TONE[st.tone].soft, TONE[st.tone].text)}>
                    <st.icon size={12} /> {st.label}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-body">
                    <Dna size={12} /> {c.kind}
                    {c.group && ` · grup ${c.group}`}
                  </span>
                  {c.parent1 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-body">
                      <Users size={12} /> {c.parent1} × {c.parent2}
                    </span>
                  )}
                  {!!c.n_trees && <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-body">{c.n_trees} sumber/pohon referensi</span>}
                </div>

                <div>
                  <Overline>Sidik jari · {c.panel.length} SNP panel</Overline>
                  {c.panel.some((p) => p.call) ? (
                    <>
                      <Fingerprint cells={cells} height="h-11" className="mt-2" />
                      <p className="mt-1.5 text-[11.5px] text-mute">
                        {c.panel.filter((p) => p.call).length} dari {c.panel.length} SNP terisi · abu = belum ada data
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-[12.5px] text-body">Belum ada sidik jari. Sampel yang mengklaim klon ini divonis BELUM ADA REFERENSI.</p>
                  )}
                </div>

                <div className="rounded-[18px] bg-cream p-[18px]">
                  <p className="flex items-center gap-2 pb-2 text-sm font-extrabold">
                    <Sprout size={16} className="text-mint-deep" /> Fakta uji lapang
                  </p>
                  {traits.isPending ? (
                    <p className="text-[12.5px] text-mute">Memuat…</p>
                  ) : traits.isError ? (
                    <Problem what="Fakta uji lapang" error={traits.error} />
                  ) : !traits.data.traits.length ? (
                    <p className="text-[12.5px] text-body">Belum ada fakta uji lapang untuk klon ini di basis data.</p>
                  ) : (
                    <>
                      {traits.data.traits.slice(0, 8).map((t) => {
                        const f = t.facts[0]
                        return (
                          <div key={t.trait} className="flex items-center justify-between gap-4 border-t border-line py-2">
                            <span className="min-w-0">
                              <span className="block text-[12.5px] font-bold">{t.label}</span>
                              <span className="block truncate text-[11px] text-mute">
                                {f.source}
                                {f.year && ` · ${f.year}`}
                                {t.facts.length > 1 && ` · +${t.facts.length - 1} sumber lain`}
                              </span>
                            </span>
                            <span className="shrink-0 text-right text-[13px] font-bold">{fact(f.value)}</span>
                          </div>
                        )
                      })}
                      <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-body">
                        <BookOpen size={12} /> Fakta terbitan, bukan prediksi model
                      </p>
                    </>
                  )}
                </div>

                <div className="space-y-2.5">
                  <Overline>Muncul di verifikasi</Overline>
                  {seen.length === 0 && !gardens.length && <Empty>Belum muncul di batch aktif dan belum terdaftar di kebun mana pun.</Empty>}
                  {seen.length > 0 && (
                    <p className="text-[12.5px] text-body">
                      {seen.filter((s) => s.verdict === 'COCOK').length} sampel COCOK di {batch.data?.name}
                      {odd.length > 0 && `, ${seen.length - seen.filter((s) => s.verdict === 'COCOK').length} perlu perhatian:`}
                    </p>
                  )}
                  {odd.map((s) => (
                    <Link
                      key={s.sample_id}
                      to={`/hasil/${batchId}/${encodeURIComponent(s.sample_id)}`}
                      className="flex items-center gap-3 rounded-2xl border border-line px-3.5 py-3 transition hover:bg-cream/60"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-[13px] font-bold">{s.sample_id}</span>
                        <span className="block truncate text-xs text-body">
                          {s.found_as === selected && s.claim !== selected ? `Diklaim ${s.claim}, DNA-nya ${selected}` : `Diklaim ${s.claim}`} · {s.provider.replace('KE Simulasi ', 'KE ')}
                        </span>
                      </span>
                      {s.verdict && <VerdictPill v={s.verdict} />}
                      <ChevronRight size={16} className="text-mute" />
                    </Link>
                  ))}
                  {gardens.map((p) => (
                    <Link key={p.id} to={`/penyedia#kebun-${p.id}`} className="flex items-center gap-3 rounded-2xl border border-line px-3.5 py-3 transition hover:bg-cream/60">
                      <IconTile icon={Warehouse} size="sm" className="size-9 bg-cream text-body" />
                      <span className="flex-1">
                        <span className="block text-[13px] font-bold">{p.name}</span>
                        <span className="text-xs text-body">Terdaftar menanam {selected}</span>
                      </span>
                      <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-[10.5px] font-extrabold text-ok">TERDAFTAR</span>
                      <ChevronRight size={16} className="text-mute" />
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </>
  )
}

// New registry entry. A fingerprint equal to an existing clone is refused as a likely synonym (GAPS G-16)
// unless the clone owner confirms they are separate entries.
function CloneForm({ names, onDone, onCancel }: { names: string[]; onDone: (name: string) => void; onCancel: () => void }) {
  const qc = useQueryClient()
  const [f, setF] = useState({ name: '', kind: 'klon', group: '', parent1: '', parent2: '', profile: '' })
  const [allowSynonym, setAllowSynonym] = useState(false)
  const parsed = parseProfile(f.profile)
  const save = useMutation({
    mutationFn: () =>
      post<{ name: string; status: string }>('/clones', {
        name: f.name.trim(),
        kind: f.kind,
        group: f.group.trim() || null,
        parent1: f.kind === 'hibrida' ? f.parent1 || null : null,
        parent2: f.kind === 'hibrida' ? f.parent2 || null : null,
        profile: parsed.profile,
        allow_synonym: allowSynonym,
      }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['clones'] })
      onDone(r.name)
    },
  })
  const synonym = save.error instanceof ApiError && save.error.status === 409 && save.error.message.includes('sinonim')

  return (
    <Card className="mt-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Tambah klon ke registri</h2>
          <p className="text-xs text-mute">Tanpa sidik jari, klon tercatat sebagai “menunggu referensi” dan belum bisa dipakai untuk vonis.</p>
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
        <datalist id="registri-nama">
          {names.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <label className="space-y-1.5">
          Nama klon
          <input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="mis. MCC 03" className={input} />
        </label>
        <label className="space-y-1.5">
          Jenis
          <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className={input}>
            <option value="klon">klon</option>
            <option value="hibrida">hibrida (benih silangan)</option>
          </select>
        </label>
        {f.kind === 'hibrida' ? (
          <>
            <label className="space-y-1.5">
              Tetua betina
              <input list="registri-nama" value={f.parent1} onChange={(e) => setF({ ...f, parent1: e.target.value })} className={input} />
            </label>
            <label className="space-y-1.5">
              Tetua jantan
              <input list="registri-nama" value={f.parent2} onChange={(e) => setF({ ...f, parent2: e.target.value })} className={input} />
            </label>
          </>
        ) : (
          <label className="space-y-1.5 sm:col-span-2">
            Grup genetik <span className="font-semibold text-mute">(opsional)</span>
            <input value={f.group} onChange={(e) => setF({ ...f, group: e.target.value })} placeholder="mis. Amelonado" className={input} />
          </label>
        )}
        <label className="space-y-1.5 sm:col-span-2">
          Sidik jari dari lab <span className="font-semibold text-mute">(opsional · satu SNP per baris: “TcSNP619 A:C”)</span>
          <textarea rows={4} value={f.profile} onChange={(e) => setF({ ...f, profile: e.target.value })} className={cx(input, 'font-mono text-[12px]')} />
          <span className="block font-semibold text-mute">
            {Object.keys(parsed.profile).length} SNP terbaca
            {parsed.bad.length > 0 && <span className="text-bad"> · {parsed.bad.length} baris tidak terbaca: {parsed.bad.slice(0, 2).join(', ')}</span>}
          </span>
        </label>
        {save.error && <Problem what="Klon" verb="ditambahkan" error={save.error} className="sm:col-span-2" />}
        {synonym && (
          <label className="flex items-start gap-2 font-semibold sm:col-span-2">
            <input type="checkbox" checked={allowSynonym} onChange={(e) => setAllowSynonym(e.target.checked)} className="mt-0.5" />
            Pemilik klon memastikan ini entri terpisah, bukan sinonim atau salah ambil pohon.
          </label>
        )}
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" disabled={save.isPending || !f.name.trim() || parsed.bad.length > 0} className="rounded-full bg-choc px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-50">
            Tambahkan
          </button>
          <button type="button" onClick={onCancel} className="rounded-full border border-line bg-white px-5 py-2.5 text-[13px] font-bold">
            Batal
          </button>
        </div>
      </form>
    </Card>
  )
}
