import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Navigate, Outlet, RouterProvider, createBrowserRouter, useLocation } from 'react-router-dom'
import { LoadingBarContainer, useLoadingBar } from 'react-top-loading-bar'
import { QueryClient, QueryClientProvider, useIsFetching, useQueryClient } from '@tanstack/react-query'
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
import HasilPonsel from './pages/m/Hasil'
import Akun from './pages/m/Akun'

function Root() {
  const { pathname } = useLocation()
  const { start, complete } = useLoadingBar()
  const qc = useQueryClient()
  const fetching = useIsFetching()
  useEffect(() => {
    window.scrollTo(0, 0)
    start()
    // Pages that fetch finish the bar when their data arrives (below); static pages never start a query.
    const t = setTimeout(() => qc.isFetching() || complete(), 150)
    return () => clearTimeout(t)
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (fetching === 0) complete()
  }, [fetching]) // eslint-disable-line react-hooks/exhaustive-deps
  return <Outlet />
}

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } })

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
          { path: 'hasil/:batchId/:sampleId', element: <Sampel /> },
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
          { path: 'hasil', element: <HasilPonsel /> },
          { path: 'hasil/:batchId/:sampleId', element: <Vonis /> },
          { path: 'akun', element: <Akun /> },
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
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </LoadingBarContainer>
  </StrictMode>,
)
