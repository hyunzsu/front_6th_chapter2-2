import { useState, useCallback } from 'react';
import { CartItem, Coupon } from '../types';
import { initialProducts } from './entities/product';
import { initialCoupons } from './entities/coupon';
import { calculateCartTotal } from './entities/cart';
import { useLocalStorage, useNotification } from './shared/hooks';
import { NotificationToast, Header } from './shared/ui';
import { useProductSearch } from './features/products/list/hooks';
import { useProducts } from './features/products/management/hooks';
import { useCart } from './features/cart/hooks';
import { useCoupons } from './features/coupons/hooks';
import { useOrder } from './features/order/hooks';
import ShoppingPage from './pages/ShoppingPage';
import AdminPage from './pages/AdminPage';

const App = () => {
  // localStorage와 연동된 데이터 상태들
  const [products, setProducts] = useLocalStorage('products', initialProducts);
  const [cart, setCart] = useLocalStorage<CartItem[]>('cart', []);
  const [coupons, setCoupons] = useLocalStorage('coupons', initialCoupons);

  // UI 상태 관리
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // 가격 포맷팅 함수 (관리자/일반 사용자 구분, 품절 처리)
  const formatPrice = (price: number, productId?: string): string => {
    if (productId) {
      const product = products.find((p) => p.id === productId);
      if (product && getRemainingStock(product) <= 0) {
        return 'SOLD OUT';
      }
    }

    if (isAdmin) {
      return `${price.toLocaleString()}원`;
    }

    return `₩${price.toLocaleString()}`;
  };

  // 장바구니 전체 금액 계산 (쿠폰 할인 포함) - entities/cart 함수 사용
  const calculateCartTotalWithCoupon = useCallback((): {
    totalBeforeDiscount: number;
    totalAfterDiscount: number;
  } => {
    return calculateCartTotal(cart, selectedCoupon);
  }, [cart, selectedCoupon]);

  // 알림 시스템
  const { notifications, addNotification, removeNotification } =
    useNotification();

  const { searchTerm, setSearchTerm, filteredProducts } =
    useProductSearch(products);

  const { addProduct, updateProduct, deleteProduct } = useProducts({
    products,
    setProducts,
    addNotification,
  });

  const { addToCart, removeFromCart, updateQuantity, getRemainingStock } =
    useCart({
      cart,
      setCart,
      products,
      addNotification,
    });

  const { addCoupon, deleteCoupon, applyCoupon } = useCoupons({
    coupons,
    setCoupons,
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


  return (
    <div className='min-h-screen bg-gray-50'>
      {/* 알림 시스템 */}
      <NotificationToast
        notifications={notifications}
        onRemove={removeNotification}
      />
      {/* 헤더 */}
      <Header
        isAdmin={isAdmin}
        searchTerm={searchTerm}
        cart={cart}
        onToggleAdmin={() => setIsAdmin(!isAdmin)}
        onSearchChange={setSearchTerm}
      />
      {/* 메인 컨텐츠 */}
      <main className='max-w-7xl mx-auto px-4 py-8'>
        {isAdmin ? (
          <AdminPage
            products={products}
            onAddProduct={addProduct}
            onUpdateProduct={updateProduct}
            onDeleteProduct={deleteProduct}
            coupons={coupons}
            onAddCoupon={addCoupon}
            onDeleteCoupon={deleteCoupon}
            formatPrice={formatPrice}
            addNotification={addNotification}
          />
        ) : (
          <ShoppingPage
            products={products}
            filteredProducts={filteredProducts}
            searchTerm={searchTerm}
            cart={cart}
            coupons={coupons}
            selectedCoupon={selectedCoupon}
            onAddToCart={addToCart}
            getRemainingStock={getRemainingStock}
            formatPrice={formatPrice}
            onRemoveFromCart={removeFromCart}
            onUpdateQuantity={updateQuantity}
            onApplyCoupon={applyCoupon}
            onSetSelectedCoupon={setSelectedCoupon}
            onCompleteOrder={completeOrder}
          />
        )}
      </main>
    </div>
  );
};

export default App;
