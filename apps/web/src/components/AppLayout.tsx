import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Database, FileText, FlaskConical, LayoutDashboard, ListChecks, Settings, Smartphone, Sparkles, Sprout, Upload, Warehouse,
} from 'lucide-react'
import { cx, useSimulated } from './ui'

// One role for now: Pengawas benih sees every module (see CLAUDE.md).
const NAV = [
  {
    group: 'Verifikasi',
    items: [
      { to: '/', label: 'Dasbor', icon: LayoutDashboard },
      { to: '/m/ambil', label: 'Ambil sampel', icon: Smartphone },
      { to: '/unggah', label: 'Unggah hasil lab', icon: Upload },
      { to: '/hasil', label: 'Hasil verifikasi', icon: ListChecks },
    ],
  },
  {
    group: 'Data',
    items: [
      { to: '/registri', label: 'Registri klon', icon: Database },
      { to: '/penyedia', label: 'Penyedia & kebun', icon: Warehouse },
    ],
  },
  {
    group: 'AI & laporan',
    items: [
      { to: '/ai', label: 'Analitik AI', icon: Sparkles },
      { to: '/laporan', label: 'Laporan', icon: FileText },
    ],
  },
]

function Logo({ className }: { className?: string }) {
  return (
    <span className={cx('flex items-center gap-2.5', className)}>
      <span className="grid size-[34px] place-items-center rounded-[11px] bg-mint text-choc">
        <Sprout size={19} />
      </span>
      <span className="font-display text-[22px] font-bold tracking-tight text-white">CacaoID</span>
    </span>
  )
}

export default function AppLayout() {
  const { pathname } = useLocation()
  const simulated = useSimulated()
  return (
    <div className="min-h-screen lg:flex lg:gap-7 lg:p-4">
      <aside
        className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[248px] shrink-0 flex-col overflow-y-auto rounded-[24px] px-3.5 pt-[22px] pb-4 lg:flex print:hidden"
        style={{ background: 'radial-gradient(160% 70% at 10% 0%, #3DDC9726, transparent 70%), #1c110c' }}
      >
        <Logo className="px-2 pb-6" />
        {NAV.map(({ group, items }) => (
          <div key={group} className="mb-3">
            <p className="px-3 pb-1.5 text-[10.5px] font-bold tracking-[0.12em] text-white/35 uppercase">{group}</p>
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cx(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                    isActive ? 'bg-mint/15 font-bold text-white' : 'font-medium text-white/70 hover:bg-white/5 hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={isActive ? 'text-mint' : 'text-white/60 group-hover:text-white'} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
        <div className="flex-1" />
        {simulated && (
          <div className="mb-1 flex items-center gap-2 rounded-xl border border-[#FFB020]/35 bg-[#FFB020]/10 px-3 py-2.5 text-[11.5px] font-extrabold tracking-wide text-[#FFC24B]">
            <FlaskConical size={15} /> DATA SIMULASI
          </div>
        )}
        <div className="flex items-center gap-2.5 rounded-[14px] bg-white/[0.06] p-2.5">
          <span className="grid size-[34px] place-items-center rounded-full bg-pod text-xs font-extrabold text-choc">PB</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold text-white">Pengawas benih</span>
            <span className="block text-[11px] text-white/50">UPTD BPSBP Sulsel</span>
          </span>
          <Settings size={16} className="text-white/50" />
        </div>
      </aside>

      <nav className="sticky top-0 z-10 flex items-center gap-3 overflow-x-auto bg-choc px-4 py-3 lg:hidden print:hidden">
        <Logo className="mr-2 shrink-0" />
        {NAV.flatMap((g) => g.items).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cx('flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs', isActive ? 'bg-white/15 font-bold text-white' : 'text-white/70')
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      <main className="min-w-0 flex-1 px-4 py-5 lg:px-0 lg:py-3.5 lg:pr-4 print:p-0">
        <div key={pathname} className="page-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
