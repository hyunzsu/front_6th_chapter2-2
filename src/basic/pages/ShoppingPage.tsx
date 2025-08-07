import { useMemo } from 'react';
import { CartItem, Coupon } from '../../types';
import { ProductWithUI } from '../entities/product';
import { calculateCartTotal } from '../entities/cart';
import { ProductList } from '../features/products/list/ui';
import { CartSidebar } from '../features/cart/ui';

interface ShoppingPageProps {
  // 상태들
  products: ProductWithUI[];
  filteredProducts: ProductWithUI[];
  searchTerm: string;
  cart: CartItem[];
  coupons: Coupon[];
  selectedCoupon: Coupon | null;

  // 상품 관련 핸들러
  onAddToCart: (product: ProductWithUI) => void;
  getRemainingStock: (product: ProductWithUI) => number;
  formatPrice: (price: number, productId?: string) => string;

  // 장바구니 관련 핸들러
  onRemoveFromCart: (productId: string) => void;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;

  // 쿠폰 관련 핸들러
  onApplyCoupon: (coupon: Coupon) => void;
  onSetSelectedCoupon: (coupon: Coupon | null) => void;

  // 주문 관련 핸들러
  onCompleteOrder: () => void;
}

export default function ShoppingPage({
  products,
  filteredProducts,
  searchTerm,
  cart,
  coupons,
  selectedCoupon,
  onAddToCart,
  getRemainingStock,
  formatPrice,
  onRemoveFromCart,
  onUpdateQuantity,
  onApplyCoupon,
  onSetSelectedCoupon,
  onCompleteOrder,
}: ShoppingPageProps) {
  // 장바구니 전체 금액 계산 (쿠폰 할인 포함)
  const totals = useMemo(() => {
    return calculateCartTotal(cart, selectedCoupon);
  }, [cart, selectedCoupon]);

  return (
    <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
      <div className='lg:col-span-3'>
        {/* 상품 목록 섹션 */}
        <section>
          <div className='mb-6 flex justify-between items-center'>
            <h2 className='text-2xl font-semibold text-gray-800'>전체 상품</h2>
            <div className='text-sm text-gray-600'>
              총 {products.length}개 상품
            </div>
          </div>

          <ProductList
            products={filteredProducts}
            searchTerm={searchTerm}
            onAddToCart={onAddToCart}
            formatPrice={formatPrice}
            getRemainingStock={getRemainingStock}
          />
        </section>
      </div>

      {/* 장바구니 사이드바 */}
      <div className='lg:col-span-1'>
        <CartSidebar
          cart={cart}
          coupons={coupons}
          selectedCoupon={selectedCoupon}
          totals={totals}
          onRemoveFromCart={onRemoveFromCart}
          onUpdateQuantity={onUpdateQuantity}
          onApplyCoupon={onApplyCoupon}
          onSetSelectedCoupon={onSetSelectedCoupon}
          onCompleteOrder={onCompleteOrder}
        />
      </div>
    </div>
  );
}
