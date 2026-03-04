import { NavLink, Outlet } from 'react-router-dom'

function AppLayout() {
  return (
    <div className="min-h-screen flex justify-center items-stretch bg-emerald-50 text-emerald-950 px-4 py-6 md:px-6">
      <div className="w-full max-w-6xl lg:max-w-7xl grid grid-cols-[260px_1fr] bg-white rounded-3xl shadow-2xl overflow-hidden">
        <aside className="px-5 py-6 border-r border-slate-200 bg-gradient-to-b from-emerald-700 to-emerald-500 text-white">
          <div className="mb-8">
            <h2 className="m-0 text-lg font-semibold tracking-tight">HealthDash</h2>
            <p className="mt-1 text-xs text-emerald-100">Salud pública · Andalucía</p>
          </div>
          <nav className="grid gap-1.5 text-sm">
            <NavItem to="/dashboard">Dashboard</NavItem>
            <NavItem to="/mapa-salud">Mapa salud</NavItem>
            <NavItem to="/tendencias">Tendencias</NavItem>
            <NavItem to="/explorador">Explorador</NavItem>
            <NavItem to="/informe">Informe PDF</NavItem>
          </nav>
        </aside>
        <main className="bg-slate-50 px-4 py-6 md:px-8 md:py-7 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

interface NavItemProps {
  to: string
  children: string
}

function NavItem({ to, children }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'block rounded-full px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-emerald-800 text-emerald-50'
            : 'text-emerald-50/80 hover:bg-emerald-600 hover:text-emerald-50',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  )
}

export default AppLayout

