import { useCallback, useEffect, useState } from "react";
import { getProducts } from "../services/productsService";
import { ApiError } from "../services/apiClient";
import type { Product } from "../types/product";
function withInventoryQuantity(products: Product[]): Product[] {
    return products.map((p) => ({
        ...p,
        inventoryQuantity: p.companyInventoryQty ?? p.stock?.reduce((sum, row) => sum + row.quantity, 0) ?? 0,
    }));
}
export function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const refetch = useCallback(() => {
        setError(null);
        return getProducts({ withStock: true })
            .then((list) => {
            setProducts(withInventoryQuantity(list));
        })
            .catch((e: unknown) => {
            setError(e instanceof ApiError ? e.message : "Error al cargar productos");
        });
    }, []);
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        getProducts({ withStock: true })
            .then((list) => {
            if (!cancelled)
                setProducts(withInventoryQuantity(list));
        })
            .catch((e: unknown) => {
            if (!cancelled) {
                setError(e instanceof ApiError ? e.message : "Error al cargar productos");
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
    return { products, loading, error, refetch };
}
