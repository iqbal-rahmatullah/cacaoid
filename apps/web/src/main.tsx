import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Navigate, Outlet, RouterProvider, createBrowserRouter, useLocation } from 'react-router-dom'
import { LoadingBarContainer, useLoadingBar } from 'react-top-loading-bar'
import './index.css'
import AppLayout from './components/AppLayout'
import PhoneLayout from './components/PhoneLayout'
import Dasbor from './pages/Dasbor'
import Unggah from './pages/Unggah'
import Hasil from './pages/Hasil'
import Sampel from './pages/Sampel'
import Registri from './pages/Registri'
import Penyedia from './pages/Penyedia'
import Ai from './pages/Ai'
import Laporan from './pages/Laporan'
import Beranda from './pages/m/Beranda'
import Ambil from './pages/m/Ambil'
import Vonis from './pages/m/Vonis'

function Root() {
  const { pathname } = useLocation()
  const { start, complete } = useLoadingBar()
  useEffect(() => {
    window.scrollTo(0, 0)
    start()
    // ponytail: pages are static, so the bar only marks the route change. Once modules fetch from
    // the API, complete it when their data arrives (e.g. TanStack Query's useIsFetching() === 0).
    const t = setTimeout(complete, 300)
    return () => clearTimeout(t)
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps
  return <Outlet />
}

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Dasbor /> },
          { path: 'unggah', element: <Unggah /> },
          { path: 'hasil', element: <Hasil /> },
          { path: 'hasil/:id', element: <Sampel /> },
          { path: 'registri', element: <Registri /> },
          { path: 'penyedia', element: <Penyedia /> },
          { path: 'ai', element: <Ai /> },
          { path: 'laporan', element: <Laporan /> },
        ],
      },
      {
        path: 'm',
        element: <PhoneLayout />,
        children: [
          { index: true, element: <Beranda /> },
          { path: 'ambil', element: <Ambil /> },
          { path: 'hasil/:id', element: <Vonis /> },
          { path: '*', element: <Navigate to="/m" replace /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LoadingBarContainer props={{ color: 'linear-gradient(90deg, #3DDC97, #FF8A3D)', height: 3, shadow: false }}>
      <RouterProvider router={router} />
    </LoadingBarContainer>
  </StrictMode>,
)
