import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";
import Spinner from "../../components/common/Spinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import ProductTable from "../../components/products/ProductTable";
import { useProducts } from "../../hooks/useProducts";
import { paths } from "../../routes/paths";
import { createCatalogArea, createCatalogTipo } from "../../services/catalogService";
import { ApiError } from "../../services/apiClient";

export default function ProductListPage() {
  const { products, loading, error, refetch } = useProducts();
  const [catalogModal, setCatalogModal] = useState<null | "area" | "tipo">(null);
  const [catalogName, setCatalogName] = useState("");
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogSaving, setCatalogSaving] = useState(false);

  function closeCatalogModal() {
    setCatalogModal(null);
    setCatalogName("");
    setCatalogError(null);
    setCatalogSaving(false);
  }

  async function submitCatalog() {
    const trimmed = catalogName.trim();
    if (!trimmed) {
      setCatalogError("Escribe un nombre.");
      return;
    }
    setCatalogSaving(true);
    setCatalogError(null);
    try {
      if (catalogModal === "area") {
        await createCatalogArea(trimmed);
      } else if (catalogModal === "tipo") {
        await createCatalogTipo(trimmed);
      }
      closeCatalogModal();
    } catch (e: unknown) {
      setCatalogError(e instanceof ApiError ? e.message : "No se pudo guardar");
    } finally {
      setCatalogSaving(false);
    }
  }

  return (
    <section>
      <div className="page-toolbar">
        <PageHeader title="Materiales" />
        {!loading && !error ? (
          <div className="page-toolbar-actions">
            <button type="button" className="toolbar-button" onClick={() => setCatalogModal("area")}>
              Añadir área
            </button>
            <button type="button" className="toolbar-button" onClick={() => setCatalogModal("tipo")}>
              Añadir tipo
            </button>
            <Link to={paths.materialNew} className="action-button">
              Añadir material
            </Link>
          </div>
        ) : null}
      </div>
      {loading && <Spinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && products.length === 0 && (
        <EmptyState title="No hay productos" hint="Usa «Añadir material» para dar de alta el primero." />
      )}
      {!loading && !error && products.length > 0 && (
        <ProductTable products={products} onChanged={refetch} />
      )}

      {catalogModal ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !catalogSaving && closeCatalogModal()}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-labelledby="catalog-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="catalog-modal-title">
              {catalogModal === "area" ? "Añadir área al catálogo" : "Añadir tipo al catálogo"}
            </h3>
            <p className="muted" style={{ margin: 0, fontSize: "0.875rem" }}>
              Aparecerá en el desplegable al crear un material. No crea un producto por sí solo.
            </p>
            <div className="stack">
              <label>
                Nombre
                <input
                  value={catalogName}
                  onChange={(e) => setCatalogName(e.target.value)}
                  disabled={catalogSaving}
                  autoFocus
                  placeholder={catalogModal === "area" ? "Ej. Sonido" : "Ej. Cable"}
                />
              </label>
            </div>
            {catalogError ? <ErrorMessage message={catalogError} /> : null}
            <div className="modal-actions">
              <button type="button" className="toolbar-button" disabled={catalogSaving} onClick={closeCatalogModal}>
                Cancelar
              </button>
              <button type="button" className="action-button" disabled={catalogSaving} onClick={() => void submitCatalog()}>
                {catalogSaving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
