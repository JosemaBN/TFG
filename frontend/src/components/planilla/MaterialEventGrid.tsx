import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, type ColDef, type ColGroupDef, type GetRowIdParams, type CellValueChangedEvent, type FirstDataRenderedEvent, type GridApi, } from "ag-grid-community";
import type { Event } from "../../types/event";
import type { PlanillaRow } from "../../types/planilla";
import { buildPlanillaData } from "../../features/planilla/buildPlanillaData";
import { filterVisiblePlanillaRows } from "../../features/planilla/filterVisiblePlanillaRows";
import { upsertEventProductPlan } from "../../services/eventProductPlanService";
import { patchProductRepQty } from "../../services/productsService";
import Spinner from "../common/Spinner";
import ErrorMessage from "../common/ErrorMessage";
import DescripcionMaterialCell from "./PlantillaDescripcionCell";
import type { PlanillaDescripcionContext } from "./PlantillaDescripcionCell";
import { PlantillaMovementButton, type PlantillaGridContext } from "./PlantillaMovementButton";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "./MaterialEventGrid.css";
ModuleRegistry.registerModules([AllCommunityModule]);
const PINNED_TOP_ROW_COUNT = 5;
const OUT_BTN_COL_WIDTH = 52;
const IN_BTN_COL_WIDTH = 44;
const METRIC_COLUMN_KEYS = ["inv", "out", "rep", "nave"] as const;
function udQtyForEvent(data: PlanillaRow, eventId: string): number {
    const raw = data[`e_${eventId}_ud`];
    if (typeof raw === "number" && Number.isFinite(raw))
        return Math.floor(raw);
    const n = parseInt(String(raw ?? "").replace(/\s/g, ""), 10);
    return Number.isFinite(n) ? Math.floor(n) : 0;
}
function coerceNonNegInt(v: unknown): number {
    if (typeof v === "number" && Number.isFinite(v))
        return Math.max(0, Math.floor(v));
    const n = parseInt(String(v ?? "").replace(/\D/g, "") || "0", 10);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}
function buildColumnDefs(events: Event[]): (ColDef<PlanillaRow> | ColGroupDef<PlanillaRow>)[] {
    const pinnedLeft: ColDef<PlanillaRow>[] = [
        {
            colId: "material",
            field: "descripcion",
            headerName: "",
            pinned: "left",
            lockPinned: true,
            suppressMovable: true,
            minWidth: 72,
            cellRenderer: DescripcionMaterialCell,
            cellClass: (p) => {
                const k = p.data?.rowKind ?? "material";
                const map: Record<string, string> = {
                    columnLabels: "planilla-cell planilla-cell--columnLabels",
                    areaSection: "planilla-cell planilla-cell--areaSection",
                    tipoSection: "planilla-cell planilla-cell--tipoSection",
                    material: "planilla-cell planilla-cell--material",
                    param: "planilla-cell planilla-cell--param",
                };
                return map[k] ?? `planilla-cell planilla-cell--${k}`;
            },
            headerClass: "planilla-header-corner",
        },
        {
            field: "inv",
            headerName: "",
            pinned: "left",
            lockPinned: true,
            suppressMovable: true,
            minWidth: 28,
            type: "numericColumn",
            editable: false,
            valueFormatter: (p) => formatCell(p.value),
            headerClass: "planilla-header-inv",
            cellClass: "planilla-cell--metric",
        },
        {
            field: "outNet",
            colId: "out",
            headerName: "",
            pinned: "left",
            lockPinned: true,
            suppressMovable: true,
            minWidth: 28,
            type: "numericColumn",
            editable: false,
            valueFormatter: (p) => formatCell(p.value),
            headerClass: "planilla-header-out",
            cellClass: "planilla-cell--metric",
        },
        {
            field: "rep",
            headerName: "",
            pinned: "left",
            lockPinned: true,
            suppressMovable: true,
            minWidth: 28,
            type: "numericColumn",
            editable: (p) => p.data?.rowKind === "material",
            cellEditor: "agNumberCellEditor",
            cellClass: "planilla-cell--metric",
            cellEditorParams: (p: {
                data?: PlanillaRow;
            }) => {
                const inv = Math.max(0, coerceNonNegInt(p.data?.inv));
                const out = Math.max(0, coerceNonNegInt(p.data?.outNet));
                const repMax = Math.max(0, inv - out);
                return { min: 0, max: repMax, precision: 0 };
            },
            valueFormatter: (p) => formatCell(p.value),
            valueParser: (p) => {
                const inv = Math.max(0, coerceNonNegInt(p.data?.inv));
                const out = Math.max(0, coerceNonNegInt(p.data?.outNet));
                const repMax = Math.max(0, inv - out);
                const n = parseInt(String(p.newValue ?? "").replace(/\D/g, "") || "0", 10);
                const v = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
                return Math.min(v, repMax);
            },
            headerClass: "planilla-header-rep",
        },
        {
            field: "nave",
            headerName: "",
            pinned: "left",
            lockPinned: true,
            suppressMovable: true,
            minWidth: 28,
            editable: false,
            cellClass: "planilla-cell--metric",
            valueGetter: (p) => {
                const d = p.data;
                if (!d)
                    return "";
                if (d.rowKind !== "material" || !d.productId)
                    return d.nave ?? "";
                const inv = coerceNonNegInt(d.inv);
                const rep = coerceNonNegInt(d.rep);
                const out = Math.max(0, coerceNonNegInt(d.outNet));
                return Math.max(0, inv - out - rep);
            },
            valueFormatter: (p) => formatCell(p.value),
            headerClass: "planilla-header-nave",
        },
    ];
    const eventGroups: ColGroupDef<PlanillaRow>[] = events.map((ev) => ({
        headerName: "",
        headerClass: "planilla-event-group",
        children: [
            {
                field: `e_${ev.id}_ud`,
                headerName: "",
                minWidth: 40,
                type: "numericColumn",
                editable: (p) => p.data?.rowKind === "material",
                cellEditor: "agNumberCellEditor",
                cellEditorParams: { min: 0, precision: 0 },
                valueFormatter: (p) => formatUdCell(p.value, p.data?.rowKind),
                valueParser: (p) => {
                    const n = parseInt(String(p.newValue ?? "").replace(/\D/g, "") || "0", 10);
                    return Number.isFinite(n) && n >= 0 ? n : 0;
                },
                cellClass: (p) => {
                    const parts = ["planilla-cell--ud"];
                    if (p.data?.rowKind !== "material" || !p.data.productId) {
                        return parts.join(" ");
                    }
                    const q = udQtyForEvent(p.data, ev.id);
                    if (q <= 0)
                        return parts.join(" ");
                    const mov = p.context?.getUdMovement?.(p.data.productId, ev.id);
                    if (mov === "ENTRADA")
                        parts.push("planilla-cell--mov-in");
                    else if (mov === "SALIDA")
                        parts.push("planilla-cell--mov-out");
                    else
                        parts.push("planilla-ud--positive");
                    return parts.join(" ");
                },
            },
            {
                colId: `e_${ev.id}_out_btn`,
                headerName: "",
                width: OUT_BTN_COL_WIDTH,
                minWidth: OUT_BTN_COL_WIDTH,
                maxWidth: OUT_BTN_COL_WIDTH,
                suppressAutoSize: true,
                suppressSizeToFit: true,
                resizable: false,
                sortable: false,
                suppressMovable: true,
                cellClass: "planilla-cell--mov-btn",
                cellRenderer: PlantillaMovementButton,
                cellRendererParams: { eventId: ev.id, movementType: "SALIDA" as const },
            },
            {
                colId: `e_${ev.id}_in_btn`,
                headerName: "",
                width: IN_BTN_COL_WIDTH,
                minWidth: IN_BTN_COL_WIDTH,
                maxWidth: IN_BTN_COL_WIDTH,
                suppressAutoSize: true,
                suppressSizeToFit: true,
                resizable: false,
                sortable: false,
                suppressMovable: true,
                cellClass: "planilla-cell--mov-btn",
                cellRenderer: PlantillaMovementButton,
                cellRendererParams: { eventId: ev.id, movementType: "ENTRADA" as const },
            },
        ],
    }));
    return [...pinnedLeft, ...eventGroups];
}
function formatCell(v: unknown): string {
    if (v === null || v === undefined || v === "")
        return "";
    return String(v);
}
function formatUdCell(v: unknown, rowKind: PlanillaRow["rowKind"] | undefined): string {
    if (rowKind === "material") {
        if (v === null || v === undefined || v === "")
            return "";
        return String(v);
    }
    return formatCell(v);
}
export default function MaterialEventGrid() {
    const [rowData, setRowData] = useState<PlanillaRow[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const highlightRef = useRef(new Map<string, "SALIDA" | "ENTRADA">());
    const pendingInAfterOutRef = useRef(new Set<string>());
    const gridApiRef = useRef<GridApi<PlanillaRow> | null>(null);
    const [collapsedAreaUids, setCollapsedAreaUids] = useState<Set<string>>(() => new Set());
    const [collapsedTipoUids, setCollapsedTipoUids] = useState<Set<string>>(() => new Set());
    const refreshGrid = useCallback(async (): Promise<PlanillaRow[] | null> => {
        try {
            const { rows, events: evs } = await buildPlanillaData();
            setRowData(rows);
            setEvents(evs);
            return rows;
        }
        catch (e) {
            console.error(e);
            return null;
        }
    }, []);
    useEffect(() => {
        let cancelled = false;
        queueMicrotask(() => {
            if (cancelled)
                return;
            setLoading(true);
            setError(null);
        });
        const loadMs = 25000;
        const timeout = new Promise<never>((_, reject) => {
            window.setTimeout(() => {
                const hint = import.meta.env.DEV && !import.meta.env.VITE_API_URL
                    ? "¿Está el backend en marcha? (raíz del repo: npm run dev, puerto 3000)."
                    : `¿Responde la API en ${import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000"}?`;
                reject(new Error(`Sin respuesta en ${loadMs / 1000}s. ${hint}`));
            }, loadMs);
        });
        Promise.race([buildPlanillaData(), timeout])
            .then(({ rows, events: evs }) => {
            if (!cancelled) {
                setRowData(rows);
                setEvents(evs);
            }
        })
            .catch((e: unknown) => {
            if (!cancelled) {
                setError(e instanceof Error ? e.message : "Error al cargar la plantilla");
            }
        })
            .finally(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, []);
    const columnDefs = useMemo(() => buildColumnDefs(events), [events]);
    const getUdMovement = useCallback((productId: string, eventId: string) => {
        return highlightRef.current.get(`${productId}|${eventId}`);
    }, []);
    const autoSizeAllToFit = useCallback((api: GridApi<PlanillaRow>) => {
        window.setTimeout(() => {
            api.autoSizeAllColumns(true);
            api.autoSizeColumns({
                colIds: [...METRIC_COLUMN_KEYS],
                skipHeader: true,
            });
        }, 0);
    }, []);
    const markOutHighlight = useCallback((productId: string, eventId: string, api: GridApi) => {
        highlightRef.current.set(`${productId}|${eventId}`, "SALIDA");
        api.refreshCells({ force: true });
    }, []);
    const markInHighlight = useCallback((productId: string, eventId: string, api: GridApi) => {
        highlightRef.current.set(`${productId}|${eventId}`, "ENTRADA");
        api.refreshCells({ force: true });
    }, []);
    const markOutAllowsIn = useCallback((productId: string, eventId: string, api: GridApi) => {
        pendingInAfterOutRef.current.add(`${productId}|${eventId}`);
        api.refreshCells({ force: true });
    }, []);
    const clearInGate = useCallback((productId: string, eventId: string, api: GridApi) => {
        pendingInAfterOutRef.current.delete(`${productId}|${eventId}`);
        api.refreshCells({ force: true });
    }, []);
    const canPressIn = useCallback((productId: string, eventId: string) => {
        return pendingInAfterOutRef.current.has(`${productId}|${eventId}`);
    }, []);
    const toggleAreaCollapse = useCallback((rowUid: string) => {
        setCollapsedAreaUids((prev) => {
            const n = new Set(prev);
            if (n.has(rowUid))
                n.delete(rowUid);
            else
                n.add(rowUid);
            return n;
        });
        window.setTimeout(() => {
            const api = gridApiRef.current;
            if (!api)
                return;
            api.refreshCells({ force: true });
            autoSizeAllToFit(api);
        }, 0);
    }, [autoSizeAllToFit]);
    const toggleTipoCollapse = useCallback((rowUid: string) => {
        setCollapsedTipoUids((prev) => {
            const n = new Set(prev);
            if (n.has(rowUid))
                n.delete(rowUid);
            else
                n.add(rowUid);
            return n;
        });
        window.setTimeout(() => {
            const api = gridApiRef.current;
            if (!api)
                return;
            api.refreshCells({ force: true });
            autoSizeAllToFit(api);
        }, 0);
    }, [autoSizeAllToFit]);
    const pinnedTopRowData = useMemo(() => rowData.slice(0, PINNED_TOP_ROW_COUNT), [rowData]);
    const bodyRowData = useMemo(() => rowData.slice(PINNED_TOP_ROW_COUNT), [rowData]);
    const visibleBodyRows = useMemo(() => filterVisiblePlanillaRows(bodyRowData, collapsedAreaUids, collapsedTipoUids), [bodyRowData, collapsedAreaUids, collapsedTipoUids]);
    const defaultColDef = useMemo<ColDef<PlanillaRow>>(() => ({
        sortable: false,
        filter: false,
        resizable: true,
        suppressHeaderMenuButton: true,
        editable: false,
        wrapText: false,
    }), []);
    const context = useMemo<PlantillaGridContext & PlanillaDescripcionContext>(() => ({
        refreshGrid,
        markOutHighlight,
        markInHighlight,
        markOutAllowsIn,
        clearInGate,
        canPressIn,
        getUdMovement,
        collapsedAreaUids,
        collapsedTipoUids,
        toggleAreaCollapse,
        toggleTipoCollapse,
    }), [
        refreshGrid,
        markOutHighlight,
        markInHighlight,
        markOutAllowsIn,
        clearInGate,
        canPressIn,
        getUdMovement,
        collapsedAreaUids,
        collapsedTipoUids,
        toggleAreaCollapse,
        toggleTipoCollapse,
    ]);
    const onFirstDataRendered = useCallback((e: FirstDataRenderedEvent<PlanillaRow>) => {
        autoSizeAllToFit(e.api);
    }, [autoSizeAllToFit]);
    useEffect(() => {
        if (loading)
            return;
        const t = window.setTimeout(() => {
            const api = gridApiRef.current;
            if (api && rowData.length > 0)
                autoSizeAllToFit(api);
        }, 100);
        return () => window.clearTimeout(t);
    }, [rowData, loading, autoSizeAllToFit]);
    const onCellValueChanged = useCallback(async (e: CellValueChangedEvent<PlanillaRow>) => {
        const field = e.colDef.field;
        if (field === "rep") {
            if (e.data?.rowKind !== "material" || !e.data.productId)
                return;
            const row = e.node.data as PlanillaRow;
            const inv = coerceNonNegInt(row.inv);
            const out = Math.max(0, coerceNonNegInt(row.outNet));
            const repMax = Math.max(0, inv - out);
            let q = typeof e.newValue === "number" ? e.newValue : parseInt(String(e.newValue ?? "0"), 10);
            if (!Number.isFinite(q) || q < 0)
                q = 0;
            q = Math.min(Math.floor(q), repMax);
            try {
                await patchProductRepQty(e.data.productId, q);
                const nave = Math.max(0, inv - out - q);
                e.node.setData({
                    ...row,
                    rep: q,
                    nave,
                    outNet: out,
                });
                e.api.refreshCells({ rowNodes: [e.node], force: true });
            }
            catch (err) {
                window.alert(err instanceof Error ? err.message : "No se pudo guardar REP");
                e.node.setDataValue("rep", e.oldValue);
            }
            return;
        }
        if (!field?.startsWith("e_") || !field.endsWith("_ud"))
            return;
        if (e.data?.rowKind !== "material" || !e.data.productId)
            return;
        const m = /^e_(.+)_(?:ud)$/.exec(field);
        if (!m)
            return;
        const eventId = m[1];
        let q = typeof e.newValue === "number" ? e.newValue : parseInt(String(e.newValue ?? "0"), 10);
        if (!Number.isFinite(q) || q < 0)
            q = 0;
        q = Math.floor(q);
        const gateKey = `${e.data.productId}|${eventId}`;
        try {
            await upsertEventProductPlan({
                eventId,
                productId: e.data.productId,
                plannedQty: q,
            });
            e.node.setDataValue(field, q);
            if (q === 0) {
                highlightRef.current.delete(gateKey);
                pendingInAfterOutRef.current.delete(gateKey);
                const rows = await refreshGrid();
                if (rows === null) {
                    window.alert("Ud se guardó a 0 en el servidor, pero no se pudo recargar la plantilla. Recarga la página (F5) para ver OUT actualizado.");
                }
                else {
                    const materialRow = rows.find((r) => r.rowKind === "material" && r.productId === e.data?.productId);
                    const outAfter = materialRow
                        ? Math.max(0, coerceNonNegInt(materialRow.outNet))
                        : 0;
                    if (outAfter > 0) {
                        window.alert("Se eliminaron los movimientos de este evento para este material. OUT sigue siendo > 0 porque hay salidas/entradas en otros eventos (otras columnas). Pon Ud a 0 en cada columna donde hubiera movimientos, o en la ficha del material usa «Quitar todos los movimientos».");
                    }
                }
            }
            else {
                e.api.refreshCells({ rowNodes: [e.node], force: true });
            }
        }
        catch (err) {
            window.alert(err instanceof Error ? err.message : "No se pudo guardar Ud");
            e.node.setDataValue(field, e.oldValue);
        }
    }, [refreshGrid]);
    const getRowClass = useCallback((p: {
        data?: PlanillaRow;
    }) => {
        const k = p.data?.rowKind ?? "material";
        return `planilla-row planilla-row--${k}`;
    }, []);
    const getRowId = useCallback((p: GetRowIdParams<PlanillaRow>) => {
        const d = p.data;
        if (d.rowUid)
            return d.rowUid;
        if (d.rowKind === "material" && d.productId)
            return `m-${d.productId}`;
        return `${d.rowKind}-${d.descripcion}`;
    }, []);
    if (loading)
        return <Spinner />;
    if (error)
        return <ErrorMessage message={error}/>;
    return (<div className="planilla-grid-wrap ag-theme-quartz">
      <AgGridReact<PlanillaRow> theme={"legacy"} rowData={visibleBodyRows} pinnedTopRowData={pinnedTopRowData} columnDefs={columnDefs} defaultColDef={defaultColDef} autoSizePadding={2} context={context} getRowClass={getRowClass} getRowId={getRowId} onGridReady={(e) => {
            gridApiRef.current = e.api;
            if (rowData.length > 0)
                autoSizeAllToFit(e.api);
        }} suppressCellFocus={false} singleClickEdit={true} stopEditingWhenCellsLoseFocus={true} onCellValueChanged={onCellValueChanged} onFirstDataRendered={onFirstDataRendered} rowHeight={40} headerHeight={0}/>
    </div>);
}
