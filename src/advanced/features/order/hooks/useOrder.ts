import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { Coupon } from '../../../../types';
import { useNotification } from '../../../shared/utils';
import { cartAtom } from '../../../shared/store';

interface UseOrderProps {
  setSelectedCoupon: React.Dispatch<React.SetStateAction<Coupon | null>>;
}

export function useOrder({ setSelectedCoupon }: UseOrderProps) {
  const { addNotification } = useNotification();
  const setCart = useSetAtom(cartAtom);

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
