import { useState, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { Coupon } from '../types';
import { initialCoupons } from './entities/coupon';
import { calculateCartTotal } from './entities/cart';
import { useLocalStorage } from './shared/hooks';
import { NotificationToast, Header } from './shared/ui';
import { cartAtom } from './shared/store';
import ShoppingPage from './pages/ShoppingPage';
import AdminPage from './pages/AdminPage';

const App = () => {
  // localStorage와 연동된 데이터 상태들
  const cart = useAtomValue(cartAtom);
  const [coupons, setCoupons] = useLocalStorage('coupons', initialCoupons);

  // UI 상태 관리
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');


  // 장바구니 전체 금액 계산 (쿠폰 할인 포함) - entities/cart 함수 사용
  const calculateCartTotalWithCoupon = useCallback((): {
    totalBeforeDiscount: number;
    totalAfterDiscount: number;
  } => {
    return calculateCartTotal(cart, selectedCoupon);
  }, [cart, selectedCoupon]);

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* 알림 시스템 */}
      <NotificationToast />
      {/* 헤더 */}
      <Header
        isAdmin={isAdmin}
        searchTerm={searchTerm}
        onToggleAdmin={() => setIsAdmin(!isAdmin)}
        onSearchChange={setSearchTerm}
      />
      {/* 메인 컨텐츠 */}
      <main className='max-w-7xl mx-auto px-4 py-8'>
        {isAdmin ? (
          <AdminPage
            coupons={coupons}
            setCoupons={setCoupons}
          />
        ) : (
          <ShoppingPage
            searchTerm={searchTerm}
            coupons={coupons}
            selectedCoupon={selectedCoupon}
            setSelectedCoupon={setSelectedCoupon}
            calculateCartTotalWithCoupon={calculateCartTotalWithCoupon}
          />
        )}
      </main>
    </div>
  );
};

export default App;
