import { Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import { paths } from "../routes/paths";

export default function HomePage() {
  return (
    <section>
      <PageHeader title="Inicio" />
      <ul className="link-list">
        <li>
          <Link to={paths.materials}>Ver materiales</Link>
        </li>
        <li>
          <Link to={paths.events}>Ver eventos</Link>
        </li>
        <li>
          <Link to={paths.plantilla}>Ver plantilla material × eventos</Link>
        </li>
      </ul>
    </section>
  );
}
