import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MapaSaludPage from './pages/MapaSaludPage'
import TendenciasPage from './pages/TendenciasPage'
import ExploradorPage from './pages/ExploradorPage'
import InformePage from './pages/InformePage'
import { RequireAuth } from './auth/AuthContext'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/mapa-salud',
        element: <MapaSaludPage />,
      },
      {
        path: '/tendencias',
        element: <TendenciasPage />,
      },
      {
        path: '/explorador',
        element: <ExploradorPage />,
      },
      {
        path: '/informe',
        element: <InformePage />,
      },
    ],
  },
])

