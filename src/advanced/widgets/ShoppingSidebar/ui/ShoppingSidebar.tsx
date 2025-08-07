import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { useCart } from '../../../features/cart/hooks';
import { calculateCartTotal } from '../../../entities/cart';
import { CartItemsList } from '../../../features/cart/ui';
import { CouponSelector } from '../../../features/coupon/shop/ui';
import { OrderSummary } from '../../../features/order/ui';
import { cartAtom, selectedCouponAtom } from '../../../shared/store';

interface ShoppingSidebarProps {
  calculateCartTotalWithCoupon: () => {
    totalBeforeDiscount: number;
    totalAfterDiscount: number;
  };
}

export function ShoppingSidebar({
  calculateCartTotalWithCoupon,
}: ShoppingSidebarProps) {
  const cart = useAtomValue(cartAtom);
  const selectedCoupon = useAtomValue(selectedCouponAtom);
  const { removeFromCart, updateQuantity } = useCart();

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
            calculateCartTotalWithCoupon={calculateCartTotalWithCoupon}
          />
          <OrderSummary
            totals={totals}
          />
        </>
      )}
    </div>
  );
}
