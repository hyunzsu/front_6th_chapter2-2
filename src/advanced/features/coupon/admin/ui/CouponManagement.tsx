import { useState, useCallback } from 'react';
import { Coupon } from '../../../../../types';
import CouponTable from './CouponTable';
import CouponForm from './CouponForm';
import { useNotification } from '../../../../shared/utils';

interface CouponManagementProps {
  coupons: Coupon[];
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
}

export function CouponManagement({
  coupons,
  setCoupons,
}: CouponManagementProps) {
  const { addNotification } = useNotification();

  const addCoupon = useCallback(
    (newCoupon: Coupon) => {
      const existingCoupon = coupons.find((c) => c.code === newCoupon.code);
      if (existingCoupon) {
        addNotification('이미 존재하는 쿠폰 코드입니다.', 'error');
        return;
      }
      setCoupons((prev) => [...prev, newCoupon]);
      addNotification('쿠폰이 추가되었습니다.', 'success');
    },
    [coupons, addNotification, setCoupons]
  );

  const deleteCoupon = useCallback(
    (couponCode: string) => {
      setCoupons((prev) => prev.filter((c) => c.code !== couponCode));
      addNotification('쿠폰이 삭제되었습니다.', 'success');
    },
    [addNotification, setCoupons]
  );

  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({
    name: '',
    code: '',
    discountType: 'amount' as 'amount' | 'percentage',
    discountValue: 0,
  });

  const handleCouponSubmit = () => {
    addCoupon(couponForm);
    resetForm();
  };

  const resetForm = () => {
    setCouponForm({
      name: '',
      code: '',
      discountType: 'amount',
      discountValue: 0,
    });
    setShowCouponForm(false);
  };

  const startAddCoupon = () => {
    setShowCouponForm(true);
  };

  return (
    <section className='bg-white rounded-lg border border-gray-200'>
      <div className='p-6 border-b border-gray-200'>
        <h2 className='text-lg font-semibold'>쿠폰 관리</h2>
      </div>

      <div className='p-6'>
        <CouponTable
          coupons={coupons}
          onDelete={deleteCoupon}
          onAddNew={startAddCoupon}
        />

        {showCouponForm && (
          <CouponForm
            couponForm={couponForm}
            setCouponForm={setCouponForm}
            onSubmit={handleCouponSubmit}
            onCancel={resetForm}
          />
        )}
      </div>
    </section>
  );
}
