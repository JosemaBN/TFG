import PageHeader from "../../components/layout/PageHeader";
import MaterialEventGrid from "../../components/planilla/MaterialEventGrid";

export default function PlanillaPage() {
  return (
    <section className="planilla-page">
      <PageHeader title="Plantilla de material y eventos" />
      <MaterialEventGrid />
    </section>
  );
}
