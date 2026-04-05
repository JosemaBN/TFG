import { useEffect, useState, useMemo, type FormEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";
import Spinner from "../../components/common/Spinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import {
  deleteProductMovements,
  getProductById,
  patchProductCompanyInventoryQty,
  updateProduct,
} from "../../services/productsService";
import { upsertStock } from "../../services/stockService";
import { getWarehouses } from "../../services/warehousesService";
import { getMovements } from "../../services/movementsService";
import { ApiError } from "../../services/apiClient";
import type { Product } from "../../types/product";
import type { Movement } from "../../types/movement";
import { paths } from "../../routes/paths";

function movementOutNet(movements: Movement[]): number {
  let salida = 0;
  let entrada = 0;
  for (const m of movements) {
    if (m.type === "SALIDA") salida += m.quantity;
    else entrada += m.quantity;
  }
  return Math.max(0, salida - entrada);
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [clearingMovements, setClearingMovements] = useState(false);

  const [marca, setMarca] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [tipo, setTipo] = useState("");
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [inventoryQty, setInventoryQty] = useState(0);

  const outNetRaw = useMemo(() => movementOutNet(movements), [movements]);

  const invSaved = product?.companyInventoryQty ?? 0;
  const repSaved = product?.repQty ?? 0;
  /** OUT no puede superar INV (mismo criterio que plantilla y API). */
  const invForOutCap = Math.max(0, Math.floor(inventoryQty));
  const outNet = useMemo(
    () => Math.min(outNetRaw, invForOutCap),
    [outNetRaw, invForOutCap]
  );
  const naveSaved = Math.max(0, invForOutCap - outNet - repSaved);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      getProductById(id),
      getWarehouses().catch(() => []),
      getMovements({ productId: id }).catch(() => []),
    ])
      .then(([data, warehouses, movs]) => {
        if (cancelled) return;
        setProduct(data);
        setMovements(movs);
        const primaryWh = warehouses[0]?.id ?? null;
        const wid =
          primaryWh != null && data.stock?.some((s) => s.warehouseId === primaryWh)
            ? primaryWh
            : data.stock?.[0]?.warehouseId ?? primaryWh ?? null;
        setWarehouseId(wid);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Producto no encontrado");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!product) return;
    setMarca(product.marca ?? "");
    setName(product.name);
    setDescription(product.description ?? "");
    setArea(product.area ?? "");
    setTipo(product.tipo ?? "");
    if (warehouseId != null) {
      const fromStock =
        product.stock?.filter((s) => s.warehouseId === warehouseId).reduce((sum, s) => sum + s.quantity, 0) ?? 0;
      setInventoryQty(product.companyInventoryQty ?? fromStock);
    } else {
      const fromStock = product.stock?.reduce((sum, row) => sum + row.quantity, 0) ?? 0;
      setInventoryQty(product.companyInventoryQty ?? fromStock);
    }
  }, [product, warehouseId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id || !name.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateProduct(id, {
        name: name.trim(),
        marca: marca.trim(),
        description: description.trim(),
        area: area.trim(),
        tipo: tipo.trim(),
      });
      if (warehouseId != null) {
        const q = Math.floor(Number(inventoryQty));
        if (!Number.isFinite(q) || q < 0) {
          setSaveError("INV debe ser un entero mayor o igual que 0.");
          return;
        }
        await upsertStock({ productId: id, warehouseId, quantity: q });
        await patchProductCompanyInventoryQty(id, q);
      }
      navigate(paths.materials);
    } catch (err: unknown) {
      setSaveError(err instanceof ApiError ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleClearAllMovements() {
    if (!id) return;
    if (
      !window.confirm(
        "¿Eliminar todos los movimientos (OUT/IN) de este material en todos los eventos? La columna OUT en plantilla pasará a 0 (salvo que vuelvas a registrar salidas)."
      )
    ) {
      return;
    }
    setClearingMovements(true);
    setSaveError(null);
    try {
      await deleteProductMovements(id);
      const movs = await getMovements({ productId: id });
      setMovements(movs);
    } catch (err: unknown) {
      setSaveError(err instanceof ApiError ? err.message : "No se pudieron eliminar los movimientos");
    } finally {
      setClearingMovements(false);
    }
  }

  if (!id) {
    return <ErrorMessage message="Falta el id del material en la URL." />;
  }

  return (
    <section>
      <p>
        <Link to={paths.materials}>← Volver a materiales</Link>
      </p>
      <PageHeader
        title={product?.name ?? "Detalle"}
        description="INV solo aquí; OUT y NAVE se calculan; REP se edita en la plantilla."
      />
      {loading && <Spinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && product && (
        <form onSubmit={handleSubmit} className="stack">
          <label>
            Área
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              disabled={saving}
              placeholder="Ej. Sonido, Iluminación"
            />
          </label>
          <label>
            Tipo
            <input
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              disabled={saving}
              placeholder="Ej. Mesa, Micro, Cable"
            />
          </label>
          <label>
            Marca
            <input
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              disabled={saving}
              placeholder="Ej. Shure, Pioneer"
            />
          </label>
          <label>
            Modelo *
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={saving}
              placeholder="Ej. SM58, CDJ-3000"
            />
          </label>
          <label>
            INV — inventario total (empresa)
            <input
              type="number"
              min={0}
              step={1}
              value={inventoryQty}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setInventoryQty(Number.isNaN(n) ? 0 : Math.max(0, n));
              }}
              disabled={saving || warehouseId == null}
            />
          </label>
          {warehouseId == null ? (
            <p className="muted">No hay ningún almacén registrado; crea uno para fijar INV y línea de stock.</p>
          ) : null}
          <div className="stack" style={{ gap: "0.35rem" }}>
            <label>
              OUT — fuera del almacén (neto OUT/IN en plantilla)
              <input type="text" readOnly value={String(outNet)} disabled className="muted" />
            </label>
            <label>
              REP — en reparación (solo lectura; edición en plantilla)
              <input type="text" readOnly value={String(repSaved)} disabled className="muted" />
            </label>
            <label>
              NAVE — disponible en almacén (INV − OUT − REP)
              <input type="text" readOnly value={String(naveSaved)} disabled className="muted" />
            </label>
            <button
              type="button"
              disabled={saving || clearingMovements || movements.length === 0}
              onClick={handleClearAllMovements}
            >
              {clearingMovements ? "Quitando…" : "Quitar todos los movimientos"}
            </button>
          </div>
          <label>
            Descripción
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={saving} />
          </label>
          {saveError ? <ErrorMessage message={saveError} /> : null}
          <button type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <p className="muted">Actualizado: {new Date(product.updatedAt).toLocaleString()}</p>
        </form>
      )}
    </section>
  );
}
