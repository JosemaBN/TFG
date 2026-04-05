import { NavLink, Outlet, useLocation } from "react-router-dom";
import { paths } from "../../routes/paths";
import "./AppLayout.css";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "nav-link nav-link--active" : "nav-link";

export default function AppLayout() {
  const { pathname } = useLocation();
  const mainWide = pathname === paths.plantilla;

  return (
    <div className="app-shell">
      <header className="app-header">
        <strong className="app-brand">Inventario por eventos</strong>
        <nav className="app-nav">
          <NavLink to={paths.home} end className={linkClass}>
            Inicio
          </NavLink>
          <NavLink to={paths.materials} className={linkClass}>
            Materiales
          </NavLink>
          <NavLink to={paths.events} className={linkClass}>
            Eventos
          </NavLink>
          <NavLink to={paths.plantilla} className={linkClass}>
            Plantilla
          </NavLink>
        </nav>
      </header>
      <main className={mainWide ? "app-main app-main--wide" : "app-main"}>
        <Outlet />
      </main>
    </div>
  );
}
