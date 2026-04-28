import { getEvents } from "../../services/eventsService";
import { getProducts } from "../../services/productsService";
import { getMovementNetByProduct } from "../../services/movementsService";
import { getEventProductPlans } from "../../services/eventProductPlanService";
import type { Event } from "../../types/event";
import type { Product } from "../../types/product";
import type { PlanillaRow } from "../../types/planilla";
function productAreaKey(p: Product): string {
    return p.area?.trim() ?? "";
}
function productTipoKey(p: Product): string {
    return p.tipo?.trim() ?? "";
}
function materialMarcaModelo(p: Product): string {
    const marca = p.marca?.trim();
    const modelo = p.name;
    if (marca)
        return `${marca} ${modelo}`.trim();
    return modelo;
}
function formatShortDate(iso: string | null): string {
    if (!iso)
        return "—";
    try {
        return new Date(iso).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }
    catch {
        return "—";
    }
}
function sortEventsByStartDate(evts: Event[]): Event[] {
    return [...evts].sort((a, b) => {
        const ta = a.startDate ? new Date(a.startDate).getTime() : Number.POSITIVE_INFINITY;
        const tb = b.startDate ? new Date(b.startDate).getTime() : Number.POSITIVE_INFINITY;
        const aOk = Number.isFinite(ta) ? ta : Number.POSITIVE_INFINITY;
        const bOk = Number.isFinite(tb) ? tb : Number.POSITIVE_INFINITY;
        const d = aOk - bOk;
        if (d !== 0)
            return d;
        return a.name.localeCompare(b.name, "es");
    });
}
function emptyEventFields(events: Event[]): Record<string, string> {
    const o: Record<string, string> = {};
    for (const ev of events) {
        o[`e_${ev.id}_ud`] = "";
    }
    return o;
}
function sortAreaKeys(keys: string[]): string[] {
    return [...keys].sort((a, b) => {
        if (a === "" && b !== "")
            return 1;
        if (b === "" && a !== "")
            return -1;
        return a.localeCompare(b, "es");
    });
}
function outNetFromSigned(netSigned: number): number {
    return Math.max(0, Math.floor(netSigned));
}
function naveFromInvOutRep(inv: number, out: number, rep: number): number {
    const i = Math.max(0, Math.floor(inv));
    const o = Math.max(0, Math.floor(out));
    const r = Math.max(0, Math.floor(rep));
    return Math.max(0, i - o - r);
}
function sortTipoKeys(keys: string[]): string[] {
    return [...keys].sort((a, b) => {
        if (a === "" && b !== "")
            return 1;
        if (b === "" && a !== "")
            return -1;
        return a.localeCompare(b, "es");
    });
}
function paramRow(descripcion: string, events: Event[], getter: (ev: Event) => string): PlanillaRow {
    const base: PlanillaRow = {
        rowKind: "param",
        descripcion,
        inv: "",
        nave: "",
        rep: "",
        outNet: "",
    };
    for (const ev of events) {
        base[`e_${ev.id}_ud`] = getter(ev);
    }
    return base;
}
export async function buildPlanillaData(): Promise<{
    rows: PlanillaRow[];
    events: Event[];
}> {
    const [eventsRaw, products, netByProduct, plans] = await Promise.all([
        getEvents(),
        getProducts(),
        getMovementNetByProduct().catch(() => ({} as Record<string, number>)),
        getEventProductPlans().catch(() => []),
    ]);
    const events = sortEventsByStartDate(eventsRaw);
    const planQty = new Map<string, number>();
    for (const pl of plans) {
        planQty.set(`${pl.eventId}\t${pl.productId}`, pl.plannedQty);
    }
    const rows: PlanillaRow[] = [];
    rows.push(paramRow("Fecha", events, (ev) => formatShortDate(ev.startDate)), paramRow("Población", events, (ev) => {
        const p = ev.poblacion?.trim() || ev.reference?.trim();
        return p || "—";
    }), paramRow("Lugar", events, (ev) => {
        const l = ev.lugar?.trim() || ev.notes?.trim();
        return l || "—";
    }), paramRow("Evento", events, (ev) => ev.name));
    const columnLabelsRow: PlanillaRow = {
        rowKind: "columnLabels",
        rowUid: "planilla-col-labels",
        descripcion: "MATERIAL",
        inv: "INV",
        outNet: "OUT",
        rep: "REP",
        nave: "NAVE",
    };
    for (const ev of events) {
        columnLabelsRow[`e_${ev.id}_ud`] = "Ud";
    }
    rows.push(columnLabelsRow);
    const areaKeys = sortAreaKeys([...new Set(products.map(productAreaKey))]);
    let areaIndex = 0;
    for (const ak of areaKeys) {
        const areaLabel = ak === "" ? "Sin área" : ak;
        rows.push({
            rowKind: "areaSection",
            rowUid: `area-${areaIndex}`,
            descripcion: areaLabel.toUpperCase(),
            inv: "",
            nave: "",
            rep: "",
            outNet: "",
            ...emptyEventFields(events),
        });
        const inArea = products.filter((p) => productAreaKey(p) === ak);
        const tipoKeys = sortTipoKeys([...new Set(inArea.map(productTipoKey))]);
        let tipoIndex = 0;
        for (const tk of tipoKeys) {
            const tipoLabel = tk === "" ? "Sin tipo" : tk;
            rows.push({
                rowKind: "tipoSection",
                rowUid: `tipo-${areaIndex}-${tipoIndex}`,
                descripcion: tipoLabel.toUpperCase(),
                inv: "",
                nave: "",
                rep: "",
                outNet: "",
                ...emptyEventFields(events),
            });
            const inTipo = inArea
                .filter((p) => productTipoKey(p) === tk)
                .sort((a, b) => {
                const ma = (a.marca ?? "").localeCompare(b.marca ?? "", "es");
                if (ma !== 0)
                    return ma;
                return a.name.localeCompare(b.name, "es");
            });
            for (const p of inTipo) {
                const inv = Math.max(0, Math.floor(p.companyInventoryQty ?? 0));
                const rep = Math.max(0, Math.floor(p.repQty ?? 0));
                const netSigned = netByProduct[p.id] ?? 0;
                const out = outNetFromSigned(netSigned);
                const nave = naveFromInvOutRep(inv, out, rep);
                const row: PlanillaRow = {
                    rowKind: "material",
                    descripcion: materialMarcaModelo(p),
                    productId: p.id,
                    inv,
                    outNet: out,
                    rep,
                    nave,
                };
                for (const ev of events) {
                    row[`e_${ev.id}_ud`] = planQty.get(`${ev.id}\t${p.id}`) ?? 0;
                }
                rows.push(row);
            }
            tipoIndex += 1;
        }
        areaIndex += 1;
    }
    return { rows, events };
}
