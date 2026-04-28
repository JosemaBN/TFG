import { useState, type FormEvent } from "react";

const NEW_AREA = "__new_area__";
const NEW_TIPO = "__new_tipo__";

type ProductFormProps = {
  onSubmit: (data: {
    marca?: string;
    name: string;
    description?: string;
    area?: string;
    tipo?: string;
    /** Unidades iniciales en el almacén (solo alta). */
    quantity: number;
  }) => void;
  submitting?: boolean;
  /** Valores de área ya usados en otros materiales (ordenados). */
  existingAreas?: string[];
  /** Valores de tipo ya usados en otros materiales (ordenados). */
  existingTipos?: string[];
};

export default function ProductForm({
  onSubmit,
  submitting,
  existingAreas = [],
  existingTipos = [],
}: ProductFormProps) {
  const [marca, setMarca] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [areaSelect, setAreaSelect] = useState("");
  const [areaNew, setAreaNew] = useState("");
  const [tipoSelect, setTipoSelect] = useState("");
  const [tipoNew, setTipoNew] = useState("");
  const [quantity, setQuantity] = useState("0");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const q = parseInt(String(quantity).replace(/\D/g, "") || "0", 10);
    const qty = Number.isFinite(q) && q >= 0 ? q : 0;
    const area =
      areaSelect === NEW_AREA ? areaNew.trim() : areaSelect.trim();
    const tipo =
      tipoSelect === NEW_TIPO ? tipoNew.trim() : tipoSelect.trim();
    onSubmit({
      marca: marca.trim() || undefined,
      name: name.trim(),
      description: description.trim() || undefined,
      area: area || undefined,
      tipo: tipo || undefined,
      quantity: qty,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="stack">
      <label>
        Área
        <select
          value={areaSelect}
          onChange={(e) => {
            const v = e.target.value;
            setAreaSelect(v);
            if (v !== NEW_AREA) setAreaNew("");
          }}
          disabled={submitting}
        >
          <option value="">— Sin área —</option>
          {existingAreas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
          <option value={NEW_AREA}>+ Crear área nueva…</option>
        </select>
      </label>
      {areaSelect === NEW_AREA ? (
        <label>
          Nombre de la nueva área
          <input
            value={areaNew}
            onChange={(e) => setAreaNew(e.target.value)}
            disabled={submitting}
            placeholder="Ej. Sonido, Iluminación"
          />
        </label>
      ) : null}
      <label>
        Tipo
        <select
          value={tipoSelect}
          onChange={(e) => {
            const v = e.target.value;
            setTipoSelect(v);
            if (v !== NEW_TIPO) setTipoNew("");
          }}
          disabled={submitting}
        >
          <option value="">— Sin tipo —</option>
          {existingTipos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
          <option value={NEW_TIPO}>+ Crear tipo nuevo…</option>
        </select>
      </label>
      {tipoSelect === NEW_TIPO ? (
        <label>
          Nombre del nuevo tipo
          <input
            value={tipoNew}
            onChange={(e) => setTipoNew(e.target.value)}
            disabled={submitting}
            placeholder="Ej. Mesa, Micro, Cable"
          />
        </label>
      ) : null}
      <label>
        Marca
        <input
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          disabled={submitting}
          placeholder="Ej. Shure, Pioneer"
        />
      </label>
      <label>
        Modelo *
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={submitting}
          placeholder="Ej. SM58, CDJ-3000"
        />
      </label>
      <label>
        Cantidad en inventario (almacén)
        <input
          type="number"
          min={0}
          step={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          disabled={submitting}
        />
      </label>
      <label>
        Descripción
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={submitting} />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? "Guardando…" : "Crear material"}
      </button>
    </form>
  );
}
