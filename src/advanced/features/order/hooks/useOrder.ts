import { useCallback } from 'react';
import { CartItem, Coupon } from '../../../../types';
import { useNotification } from '../../../shared/utils';

interface UseOrderProps {
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  setSelectedCoupon: React.Dispatch<React.SetStateAction<Coupon | null>>;
}

export function useOrder({ setCart, setSelectedCoupon }: UseOrderProps) {
  const { addNotification } = useNotification();

  // 주문 완료 처리
  const completeOrder = useCallback(() => {
    const orderNumber = `ORD-${Date.now()}`;
    addNotification(
      `주문이 완료되었습니다. 주문번호: ${orderNumber}`,
      'success'
    );
    setCart([]);
    setSelectedCoupon(null);
  }, [addNotification, setCart, setSelectedCoupon]);

  return {
    completeOrder,
  };
}
