import { useState, useCallback, useEffect } from 'react';
import { CartItem, Coupon, Product } from '../types';

import { ProductWithUI, initialProducts } from './entities/product';
import { initialCoupons } from './entities/coupon';
import { calculateCartTotal } from './entities/cart';

import { useLocalStorage, useNotification } from './shared/hooks';
import { NotificationToast, SearchInput, Button } from './shared/ui';

import { useProductSearch } from './features/products/list/hooks';
import { useProducts } from './features/products/management/hooks';
import { ProductManagement } from './features/products/management/ui';
import { ProductList } from './features/products/list/ui';

import { useCart } from './features/cart/hooks';
import { CartSidebar } from './features/cart/ui';

import { useCoupons } from './features/coupons/hooks';
import { CouponManagement } from './features/coupons/ui';

const App = () => {
  // ============================================================================
  // 상태 관리 - localStorage와 연동된 데이터 상태들
  // ============================================================================

  // localStorage와 연동된 데이터 상태들
  const [products, setProducts] = useLocalStorage('products', initialProducts);
  const [cart, setCart] = useLocalStorage<CartItem[]>('cart', []);
  const [coupons, setCoupons] = useLocalStorage('coupons', initialCoupons);

  // ============================================================================
  // UI 상태 관리 - 화면 표시 및 사용자 인터랙션 관련 상태들
  // ============================================================================

  // UI 상태 관리
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'coupons'>(
    'products'
  );

  // ============================================================================
  // 유틸리티 함수들 - 데이터 포맷팅 및 계산 로직
  // ============================================================================

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

  // ============================================================================
  // 파생 상태 - 다른 상태로부터 계산되는 값들
  // ============================================================================

  const [totalItemCount, setTotalItemCount] = useState(0);

  // 장바구니 아이템 수 업데이트
  useEffect(() => {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    setTotalItemCount(count);
  }, [cart]);

  // ============================================================================
  // 주문 처리 로직
  // ============================================================================

  // 주문 완료 처리
  const completeOrder = useCallback(() => {
    const orderNumber = `ORD-${Date.now()}`;
    addNotification(
      `주문이 완료되었습니다. 주문번호: ${orderNumber}`,
      'success'
    );
    setCart([]);
    setSelectedCoupon(null);
  }, [addNotification, setCart]);

  // ============================================================================
  // 계산된 값들 - 렌더링에 필요한 파생 데이터
  // ============================================================================

  const totals = calculateCartTotalWithCoupon();

  // ============================================================================
  // 거대한 JSX 렌더링 - ProductList, ProductManagement 컴포넌트로 교체
  // ============================================================================

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* 알림 시스템 */}
      <NotificationToast
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* 헤더 */}
      <header className='bg-white shadow-sm sticky top-0 z-40 border-b'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center flex-1'>
              <h1 className='text-xl font-semibold text-gray-800'>SHOP</h1>
              {/* 검색창 */}
              {!isAdmin && (
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder='상품 검색...'
                  className='ml-8 flex-1 max-w-md'
                />
              )}
            </div>
            <nav className='flex items-center space-x-4'>
              <Button
                onClick={() => setIsAdmin(!isAdmin)}
                variant={isAdmin ? 'primary' : 'ghost'}
                size='sm'
              >
                {isAdmin ? '쇼핑몰로 돌아가기' : '관리자 페이지로'}
              </Button>
              {!isAdmin && (
                <div className='relative'>
                  <svg
                    className='w-6 h-6 text-gray-700'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'
                    />
                  </svg>
                  {cart.length > 0 && (
                    <span className='absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                      {totalItemCount}
                    </span>
                  )}
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className='max-w-7xl mx-auto px-4 py-8'>
        {isAdmin ? (
          // ============================================================================
          // 관리자 페이지
          // ============================================================================
          <div className='max-w-6xl mx-auto'>
            <div className='mb-8'>
              <h1 className='text-2xl font-bold text-gray-900'>
                관리자 대시보드
              </h1>
              <p className='text-gray-600 mt-1'>
                상품과 쿠폰을 관리할 수 있습니다
              </p>
            </div>

            {/* 탭 네비게이션 */}
            <div className='border-b border-gray-200 mb-6'>
              <nav className='-mb-px flex space-x-8'>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'products'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  상품 관리
                </button>
                <button
                  onClick={() => setActiveTab('coupons')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'coupons'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  쿠폰 관리
                </button>
              </nav>
            </div>

            {activeTab === 'products' ? (
              <ProductManagement
                products={products}
                onAddProduct={addProduct}
                onUpdateProduct={updateProduct}
                onDeleteProduct={deleteProduct}
                formatPrice={formatPrice}
                addNotification={addNotification}
              />
            ) : (
              <CouponManagement
                coupons={coupons}
                onAddCoupon={addCoupon}
                onDeleteCoupon={deleteCoupon}
                addNotification={addNotification}
              />
            )}
          </div>
        ) : (
          // ============================================================================
          // 쇼핑몰 메인 페이지
          // ============================================================================
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
            <div className='lg:col-span-3'>
              {/* 상품 목록 섹션 */}
              <section>
                <div className='mb-6 flex justify-between items-center'>
                  <h2 className='text-2xl font-semibold text-gray-800'>
                    전체 상품
                  </h2>
                  <div className='text-sm text-gray-600'>
                    총 {products.length}개 상품
                  </div>
                </div>

                <ProductList
                  products={filteredProducts}
                  searchTerm={searchTerm}
                  // cart={cart}
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
        )}
      </main>
    </div>
  );
};

export default App;
