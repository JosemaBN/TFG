import { useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../../types/product";
import { paths } from "../../routes/paths";
import { deleteProduct, reorderProduct } from "../../services/productsService";
import { ApiError } from "../../services/apiClient";

type ProductTableProps = {
  products: Product[];
  onChanged?: () => void;
};

export default function ProductTable({ products, onChanged }: ProductTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

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

  async function handleReorder(id: string, direction: "up" | "down") {
    setReorderingId(id);
    try {
      await reorderProduct(id, direction);
      onChanged?.();
    } catch (e: unknown) {
      window.alert(e instanceof ApiError ? e.message : "Error al cambiar el orden");
    } finally {
      setReorderingId(null);
    }
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Área</th>
            <th>Tipo</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Inventario</th>
            <th className="table-th-narrow" title="Orden manual (tras área, tipo y marca)">
              ⇅
            </th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, index) => (
            <tr key={p.id}>
              <td>{p.area ?? "—"}</td>
              <td>{p.tipo ?? "—"}</td>
              <td>{p.marca ?? "—"}</td>
              <td>{p.name}</td>
              <td>{p.inventoryQuantity ?? 0}</td>
              <td>
                <div className="table-reorder">
                  <button
                    type="button"
                    title="Subir en el listado"
                    disabled={index === 0 || reorderingId != null}
                    onClick={() => void handleReorder(p.id, "up")}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    title="Bajar en el listado"
                    disabled={index === products.length - 1 || reorderingId != null}
                    onClick={() => void handleReorder(p.id, "down")}
                  >
                    ↓
                  </button>
                </div>
              </td>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
