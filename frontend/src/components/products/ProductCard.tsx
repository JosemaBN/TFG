import { Link } from "react-router-dom";
import type { Product } from "../../types/product";
import { paths } from "../../routes/paths";
type ProductCardProps = {
    product: Product;
};
export default function ProductCard({ product }: ProductCardProps) {
    return (<article className="card">
      <Link to={paths.materialDetail(product.id)} className="card__link">
        <h3>{product.name}</h3>
      </Link>
      {product.marca ? <p className="muted">Marca: {product.marca}</p> : null}
      {product.inventoryQuantity != null ? (<p className="muted">Inventario: {product.inventoryQuantity}</p>) : null}
      {(product.area || product.tipo) ? (<p className="muted">
          {[product.area, product.tipo].filter(Boolean).join(" · ")}
        </p>) : null}
      {product.description ? <p>{product.description}</p> : null}
    </article>);
}
