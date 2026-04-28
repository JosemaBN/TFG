import { NavLink, Outlet } from "react-router-dom";
import { paths } from "../../routes/paths";
import "./AppLayout.css";
const linkClass = ({ isActive }: {
    isActive: boolean;
}) => isActive ? "nav-link nav-link--active" : "nav-link";
export default function AppLayout() {
    return (<div className="app-shell">
      <header className="app-header">
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
      <main className="app-main">
        <Outlet />
      </main>
    </div>);
}
