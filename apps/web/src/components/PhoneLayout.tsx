import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ArrowLeft, BatteryFull, CircleUserRound, House, ListChecks, ScanLine, Signal, Wifi } from 'lucide-react'
import { cx } from './ui'

const TABS = [
  { to: '/m', label: 'Beranda', icon: House },
  { to: '/m/ambil', label: 'Ambil', icon: ScanLine },
  { to: '/m/hasil', label: 'Hasil', icon: ListChecks },
  { to: '/m/akun', label: 'Akun', icon: CircleUserRound },
]

// The field app is the same web app opened in a phone browser (no install). On a desktop
// screen it is shown inside a phone frame so the demo can switch between both views.
export default function PhoneLayout() {
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen md:flex md:items-center md:justify-center md:gap-16 md:p-8">
      <aside className="hidden max-w-xs md:block">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-mint-deep hover:underline">
          <ArrowLeft size={16} /> Kembali ke aplikasi web
        </Link>
        <h1 className="mt-5 font-display text-4xl leading-[1.05] font-bold tracking-tight">Tampilan ponsel pengawas</h1>
        <p className="mt-3 text-sm leading-relaxed text-body">
          Web app yang sama, dibuka di browser ponsel. Tidak perlu instal dari Play Store; sampel tetap tersimpan saat tidak ada sinyal.
        </p>
      </aside>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[390px] md:mx-0 md:w-[390px] md:shrink-0 flex-col bg-cream md:min-h-0 md:h-[844px] md:overflow-hidden md:rounded-[44px] md:border-[10px] md:border-choc md:shadow-[0_30px_80px_-20px_rgba(61,42,31,0.45)]">
        <div className="flex h-[54px] shrink-0 items-center justify-between px-7 font-[Inter,system-ui] text-[15px] font-semibold">
          9:41
          <span className="flex items-center gap-1.5">
            <Signal size={16} /> <Wifi size={16} /> <BatteryFull size={22} />
          </span>
        </div>
        <div key={pathname} className="page-in flex-1 overflow-y-auto px-5 pb-28">
          <Outlet />
        </div>
        <nav className="absolute inset-x-4 bottom-3 flex h-[60px] gap-1 rounded-full border border-line bg-white/85 p-1.5 shadow-[0_8px_24px_-6px_rgba(61,42,31,0.25)] backdrop-blur-xl">
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/m'}
              className={({ isActive }) =>
                cx('flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[10px]', isActive ? 'bg-mint-soft font-extrabold text-mint-deep' : 'font-semibold text-mute')
              }
            >
              <Icon size={21} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
