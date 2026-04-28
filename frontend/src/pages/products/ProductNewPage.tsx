import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";
import ErrorMessage from "../../components/common/ErrorMessage";
import ProductForm from "../../components/products/ProductForm";
import {
  createProduct,
  getProducts,
  patchProductCompanyInventoryQty,
} from "../../services/productsService";
import { getCatalogAreas, getCatalogTipos } from "../../services/catalogService";
import { upsertStock } from "../../services/stockService";
import { getWarehouses } from "../../services/warehousesService";
import { ApiError } from "../../services/apiClient";
import { paths } from "../../routes/paths";

export default function ProductNewPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultWarehouseId, setDefaultWarehouseId] = useState<string | null>(null);
  const [warehouseHint, setWarehouseHint] = useState<string | null>(null);
  const [existingAreas, setExistingAreas] = useState<string[]>([]);
  const [existingTipos, setExistingTipos] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getProducts(), getCatalogAreas().catch(() => []), getCatalogTipos().catch(() => [])])
      .then(([list, catalogAreas, catalogTipos]) => {
        if (cancelled) return;
        const areas = new Set<string>();
        const tipos = new Set<string>();
        for (const p of list) {
          const a = p.area?.trim();
          if (a) areas.add(a);
          const t = p.tipo?.trim();
          if (t) tipos.add(t);
        }
        for (const row of catalogAreas) {
          const n = row.name?.trim();
          if (n) areas.add(n);
        }
        for (const row of catalogTipos) {
          const n = row.name?.trim();
          if (n) tipos.add(n);
        }
        setExistingAreas([...areas].sort((x, y) => x.localeCompare(y, "es")));
        setExistingTipos([...tipos].sort((x, y) => x.localeCompare(y, "es")));
      })
      .catch(() => {
        if (!cancelled) {
          setExistingAreas([]);
          setExistingTipos([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getWarehouses()
      .then((list) => {
        if (cancelled) return;
        if (list.length > 0) {
          setDefaultWarehouseId(list[0].id);
          setWarehouseHint(null);
        } else {
          setDefaultWarehouseId(null);
          setWarehouseHint("No hay almacén creado: la cantidad no se guardará hasta que exista uno en el sistema.");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDefaultWarehouseId(null);
          setWarehouseHint("No se pudo comprobar el almacén.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <p>
        <Link to={paths.materials}>← Volver a materiales</Link>
      </p>
      <PageHeader title="Añadir material" />
      {error ? <ErrorMessage message={error} /> : null}
      {warehouseHint ? <p className="muted">{warehouseHint}</p> : null}
      <ProductForm
        submitting={submitting}
        existingAreas={existingAreas}
        existingTipos={existingTipos}
        onSubmit={async (data) => {
          setSubmitting(true);
          setError(null);
          try {
            const { quantity, ...productBody } = data;
            const created = await createProduct(productBody);
            if (quantity > 0) {
              await patchProductCompanyInventoryQty(created.id, quantity);
            }
            if (quantity > 0 && defaultWarehouseId) {
              await upsertStock({
                productId: created.id,
                warehouseId: defaultWarehouseId,
                quantity,
              });
            } else if (quantity > 0 && !defaultWarehouseId) {
              setError(
                "Hay cantidad indicada pero no hay almacén: el producto se creó sin stock. Crea un almacén y asigna stock después."
              );
            }
            navigate(paths.materials);
          } catch (e: unknown) {
            setError(e instanceof ApiError ? e.message : "No se pudo crear el material");
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </section>
  );
}
