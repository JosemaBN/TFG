import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../../types/product";
import { paths } from "../../routes/paths";
import { deleteProduct } from "../../services/productsService";
import { ApiError } from "../../services/apiClient";

type ProductTableProps = {
  products: Product[];
  onChanged?: () => void;
};

function areaKey(p: Product): string {
  const v = p.area?.trim();
  return v ? v : "__sin_area__";
}

function tipoKey(p: Product): string {
  const v = p.tipo?.trim();
  return v ? v : "__sin_tipo__";
}

function labelArea(k: string): string {
  return k === "__sin_area__" ? "Sin área" : k;
}

function labelTipo(k: string): string {
  return k === "__sin_tipo__" ? "Sin tipo" : k;
}

function sortKeys(keys: string[], label: (k: string) => string, emptyKey: string): string[] {
  return [...keys].sort((a, b) => {
    if (a === emptyKey && b !== emptyKey) return 1;
    if (b === emptyKey && a !== emptyKey) return -1;
    return label(a).localeCompare(label(b), "es");
  });
}

export default function ProductTable({ products, onChanged }: ProductTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hiddenAreas, setHiddenAreas] = useState<string[]>([]);
  const [hiddenTipos, setHiddenTipos] = useState<string[]>([]);
  const [areaMenuOpen, setAreaMenuOpen] = useState(false);
  const [tipoMenuOpen, setTipoMenuOpen] = useState(false);
  const areaBtnRef = useRef<HTMLButtonElement | null>(null);
  const tipoBtnRef = useRef<HTMLButtonElement | null>(null);

  const areaKeys = useMemo(() => {
    const s = new Set(products.map(areaKey));
    return sortKeys([...s], labelArea, "__sin_area__");
  }, [products]);

  const tipoKeys = useMemo(() => {
    const s = new Set(products.map(tipoKey));
    return sortKeys([...s], labelTipo, "__sin_tipo__");
  }, [products]);

  const visibleProducts = useMemo(() => {
    const a = new Set(hiddenAreas);
    const t = new Set(hiddenTipos);
    return products.filter((p) => !a.has(areaKey(p)) && !t.has(tipoKey(p)));
  }, [products, hiddenAreas, hiddenTipos]);

  function toggleAreaHidden(k: string) {
    setHiddenAreas((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  }

  function toggleTipoHidden(k: string) {
    setHiddenTipos((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  }

  function clearAllFilters() {
    setHiddenAreas([]);
    setHiddenTipos([]);
  }

  async function handleDelete(id: string, modelName: string) {
    if (!window.confirm(`¿Eliminar «${modelName}»? Se borrarán también stock y movimientos asociados.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteProduct(id);
      onChanged?.();
    } catch (e: unknown) {
      window.alert(e instanceof ApiError ? e.message : "Error al eliminar el material");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="table-wrap">
      {areaMenuOpen || tipoMenuOpen ? (
        <div
          className="popover-backdrop"
          role="presentation"
          onClick={() => {
            setAreaMenuOpen(false);
            setTipoMenuOpen(false);
          }}
        />
      ) : null}
      <table className="table table--center-cells">
        <thead>
          <tr>
            <th>
              <span className="th-with-btn">
                <span>Área</span>
                <button
                  ref={areaBtnRef}
                  type="button"
                  className="th-popover-btn"
                  aria-haspopup="dialog"
                  aria-expanded={areaMenuOpen}
                  onClick={() => {
                    setAreaMenuOpen((v) => !v);
                    setTipoMenuOpen(false);
                  }}
                >
                  ▾
                </button>
              </span>
              {areaMenuOpen ? (
                <div className="th-popover" role="dialog" aria-label="Filtrar por área">
                  <div className="th-popover-title">Áreas</div>
                  <div className="th-popover-list">
                    {areaKeys.map((k) => {
                      const hidden = hiddenAreas.includes(k);
                      return (
                        <div key={k} className="th-popover-row">
                          <span className="th-popover-label">{labelArea(k)}</span>
                          <button
                            type="button"
                            className={hidden ? "toolbar-button" : "action-button"}
                            onClick={() => toggleAreaHidden(k)}
                          >
                            {hidden ? "Mostrar" : "Ocultar"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="th-popover-footer">
                    <button type="button" className="toolbar-button" onClick={clearAllFilters}>
                      Mostrar todo
                    </button>
                  </div>
                </div>
              ) : null}
            </th>
            <th>
              <span className="th-with-btn">
                <span>Tipo</span>
                <button
                  ref={tipoBtnRef}
                  type="button"
                  className="th-popover-btn"
                  aria-haspopup="dialog"
                  aria-expanded={tipoMenuOpen}
                  onClick={() => {
                    setTipoMenuOpen((v) => !v);
                    setAreaMenuOpen(false);
                  }}
                >
                  ▾
                </button>
              </span>
              {tipoMenuOpen ? (
                <div className="th-popover" role="dialog" aria-label="Filtrar por tipo">
                  <div className="th-popover-title">Tipos</div>
                  <div className="th-popover-list">
                    {tipoKeys.map((k) => {
                      const hidden = hiddenTipos.includes(k);
                      return (
                        <div key={k} className="th-popover-row">
                          <span className="th-popover-label">{labelTipo(k)}</span>
                          <button
                            type="button"
                            className={hidden ? "toolbar-button" : "action-button"}
                            onClick={() => toggleTipoHidden(k)}
                          >
                            {hidden ? "Mostrar" : "Ocultar"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="th-popover-footer">
                    <button type="button" className="toolbar-button" onClick={clearAllFilters}>
                      Mostrar todo
                    </button>
                  </div>
                </div>
              ) : null}
            </th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Inventario</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {visibleProducts.length === 0 ? (
            <tr>
              <td colSpan={6} className="table-empty-filtered">
                Ningún material coincide con los filtros (área o tipo ocultos).{" "}
                <button type="button" className="table-empty-filtered-link" onClick={clearAllFilters}>
                  Mostrar todo
                </button>
              </td>
            </tr>
          ) : null}
          {visibleProducts.map((p) => {
            return (
            <tr key={p.id}>
              <td>{p.area ?? "—"}</td>
              <td>{p.tipo ?? "—"}</td>
              <td>{p.marca ?? "—"}</td>
              <td>{p.name}</td>
              <td>{p.inventoryQuantity ?? 0}</td>
              <td>
                <div className="table-inline-actions">
                  <Link to={paths.materialDetail(p.id)} className="table-action-link">
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="table-action-danger"
                    disabled={deletingId === p.id}
                    onClick={() => void handleDelete(p.id, p.name)}
                  >
                    {deletingId === p.id ? "…" : "Eliminar"}
                  </button>
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
