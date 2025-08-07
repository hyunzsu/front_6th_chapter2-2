import { useMemo } from 'react';
import { CartItem, Coupon } from '../../types';
import { ProductWithUI } from '../entities/product';
import { ProductList } from '../features/products/shop/ui';
import { CartSidebar } from '../features/cart/ui';
import { useCoupons } from '../features/coupons/hooks';
import { useCart } from '../features/cart/hooks';
import { useOrder } from '../features/order/hooks';
import { useProductSearch } from '../features/products/shop/hooks';

interface ShoppingPageProps {
  products: ProductWithUI[];
  searchTerm: string;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  coupons: Coupon[];
  selectedCoupon: Coupon | null;
  setSelectedCoupon: React.Dispatch<React.SetStateAction<Coupon | null>>;
  addNotification: (
    message: string,
    type?: 'error' | 'success' | 'warning'
  ) => void;
  calculateCartTotalWithCoupon: () => {
    totalBeforeDiscount: number;
    totalAfterDiscount: number;
  };
}

export default function ShoppingPage({
  products,
  searchTerm,
  cart,
  setCart,
  coupons,
  selectedCoupon,
  setSelectedCoupon,
  addNotification,
  calculateCartTotalWithCoupon,
}: ShoppingPageProps) {
  const { filteredProducts } = useProductSearch(products, searchTerm);

  const { addToCart, removeFromCart, updateQuantity, getRemainingStock } =
    useCart({
      cart,
      setCart,
      products,
      addNotification,
    });

  const { applyCoupon } = useCoupons({
    coupons,
    setCoupons: () => {}, // Shopping에서는 쿠폰 수정 불필요
    selectedCoupon,
    setSelectedCoupon,
    addNotification,
    calculateCartTotalWithCoupon,
  });

  const { completeOrder } = useOrder({
    setCart,
    setSelectedCoupon,
    addNotification,
  });

  // ShoppingPage용 가격 포맷팅 (고객 전용)
  const formatPrice = (price: number, productId?: string): string => {
    if (productId) {
      const product = products.find((p) => p.id === productId);
      if (product && getRemainingStock(product) <= 0) {
        return 'SOLD OUT';
      }
    }
    return `₩${price.toLocaleString()}`; // 고객은 ₩ 표시
  };

  const totals = useMemo(() => {
    return calculateCartTotalWithCoupon();
  }, [calculateCartTotalWithCoupon]);

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
            onAddToCart={addToCart}
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
          onRemoveFromCart={removeFromCart}
          onUpdateQuantity={updateQuantity}
          onApplyCoupon={applyCoupon}
          onSetSelectedCoupon={setSelectedCoupon}
          onCompleteOrder={completeOrder}
        />
      </div>
    </div>
  );
}
