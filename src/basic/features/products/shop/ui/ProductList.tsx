// import { CartItem } from '../../../../../types';
import { ProductWithUI } from '../../../../entities/product';
import ProductCard from './ProductCard';

interface ProductListProps {
  products: ProductWithUI[];
  searchTerm: string;
  // cart: CartItem[];
  onAddToCart: (product: ProductWithUI) => void;
  formatPrice: (price: number, productId?: string) => string;
  getRemainingStock: (product: ProductWithUI) => number;
}

export default function ProductList({
  products,
  searchTerm,
  // cart,
  onAddToCart,
  formatPrice,
  getRemainingStock,
}: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-500'>
          "{searchTerm}"에 대한 검색 결과가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
      {products.map((product) => {
        const remainingStock = getRemainingStock(product);

        return (
          <ProductCard
            key={product.id}
            product={product}
            remainingStock={remainingStock}
            onAddToCart={onAddToCart}
            formatPrice={formatPrice}
          />
        );
      })}
    </div>
  );
}
