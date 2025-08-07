import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Coupon } from '../../../../types';
import { ProductWithUI } from '../../../entities/product';
import { useCart } from '../../../features/cart/hooks';
import { calculateCartTotal } from '../../../entities/cart';
import { CartItemsList } from '../../../features/cart/ui';
import { CouponSelector } from '../../../features/coupon/shop/ui';
import { OrderSummary } from '../../../features/order/ui';
import { cartAtom } from '../../../shared/store';

interface ShoppingSidebarProps {
  coupons: Coupon[];
  selectedCoupon: Coupon | null;
  setSelectedCoupon: React.Dispatch<React.SetStateAction<Coupon | null>>;
  products: ProductWithUI[];
  calculateCartTotalWithCoupon: () => {
    totalBeforeDiscount: number;
    totalAfterDiscount: number;
  };
}

export function ShoppingSidebar({
  coupons,
  selectedCoupon,
  setSelectedCoupon,
  products,
  calculateCartTotalWithCoupon,
}: ShoppingSidebarProps) {
  const cart = useAtomValue(cartAtom);
  const { removeFromCart, updateQuantity } = useCart({ products });

  const totals = useMemo(() => {
    return calculateCartTotal(cart, selectedCoupon);
  }, [cart, selectedCoupon]);

  return (
    <div className='sticky top-24 space-y-4'>
      {/* 장바구니 아이템 섹션 */}
      <CartItemsList
        cart={cart}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
      />
      {/* 쿠폰 + 주문 섹션 */}
      {cart.length > 0 && (
        <>
          <CouponSelector
            coupons={coupons}
            selectedCoupon={selectedCoupon}
            setSelectedCoupon={setSelectedCoupon}
            calculateCartTotalWithCoupon={calculateCartTotalWithCoupon}
          />
          <OrderSummary
            totals={totals}
            setSelectedCoupon={setSelectedCoupon}
          />
        </>
      )}
    </div>
  );
}
