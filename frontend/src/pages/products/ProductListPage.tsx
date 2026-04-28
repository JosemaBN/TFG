import { Link } from "react-router-dom";
import Spinner from "../../components/common/Spinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import ProductTable from "../../components/products/ProductTable";
import { useProducts } from "../../hooks/useProducts";
import { paths } from "../../routes/paths";

export default function ProductListPage() {
  const { products, loading, error, refetch } = useProducts();

  return (
    <section>
      <div className="page-toolbar">
        {!loading && !error ? (
          <div className="page-toolbar-actions">
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
    </section>
  );
}
