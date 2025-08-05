import { useState, useCallback, useEffect } from 'react';
import { CartItem, Coupon, Product } from '../types';

import { ProductWithUI, initialProducts } from './entities/product';
import { initialCoupons } from './entities/coupon';
import { calculateItemTotal, calculateCartTotal } from './entities/cart';

import { useLocalStorage, useNotification } from './shared/hooks';
import { NotificationToast, SearchInput, Button } from './shared/ui';

import { useProductSearch } from './features/products/list/hooks';
import { useProducts } from './features/products/management/hooks';
import { ProductManagement } from './features/products/management/ui';
import { ProductList } from './features/products/list/ui';

const App = () => {
  // ============================================================================
  // 상태 관리 - localStorage와 연동된 데이터 상태들
  // ============================================================================

  // localStorage와 연동된 데이터 상태들
  const [products, setProducts] = useLocalStorage('products', initialProducts);
  const [cart, setCart] = useLocalStorage<CartItem[]>('cart', []);
  const [coupons, setCoupons] = useLocalStorage('coupons', initialCoupons);

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

  // ============================================================================
  // UI 상태 관리 - 화면 표시 및 사용자 인터랙션 관련 상태들
  // ============================================================================

  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'coupons'>(
    'products'
  );

  // ============================================================================
  // 관리자 폼 상태 - 쿠폰 편집을 위한 폼 데이터만 남음 (상품 폼은 ProductManagement에서 관리)
  // ============================================================================

  const [couponForm, setCouponForm] = useState({
    name: '',
    code: '',
    discountType: 'amount' as 'amount' | 'percentage',
    discountValue: 0,
  });

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

  // 남은 재고 계산 (전체 재고 - 장바구니 수량)
  const getRemainingStock = (product: Product): number => {
    const cartItem = cart.find((item) => item.product.id === product.id);
    const remaining = product.stock - (cartItem?.quantity || 0);
    return remaining;
  };

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
  // 장바구니 관련 비즈니스 로직
  // ============================================================================

  // 장바구니에 상품 추가
  const addToCart = useCallback(
    (product: ProductWithUI) => {
      const remainingStock = getRemainingStock(product);
      if (remainingStock <= 0) {
        addNotification('재고가 부족합니다!', 'error');
        return;
      }

      setCart((prevCart) => {
        const existingItem = prevCart.find(
          (item) => item.product.id === product.id
        );

        if (existingItem) {
          const newQuantity = existingItem.quantity + 1;

          if (newQuantity > product.stock) {
            addNotification(
              `재고는 ${product.stock}개까지만 있습니다.`,
              'error'
            );
            return prevCart;
          }

          return prevCart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: newQuantity }
              : item
          );
        }

        return [...prevCart, { product, quantity: 1 }];
      });

      addNotification('장바구니에 담았습니다', 'success');
    },
    [cart, addNotification, getRemainingStock]
  );

  // 장바구니에서 상품 제거
  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product.id !== productId)
    );
  }, []);

  // 장바구니 상품 수량 업데이트
  const updateQuantity = useCallback(
    (productId: string, newQuantity: number) => {
      if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
      }

      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const maxStock = product.stock;
      if (newQuantity > maxStock) {
        addNotification(`재고는 ${maxStock}개까지만 있습니다.`, 'error');
        return;
      }

      setCart((prevCart) =>
        prevCart.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    },
    [products, removeFromCart, addNotification, getRemainingStock]
  );

  // ============================================================================
  // 쿠폰 관련 비즈니스 로직
  // ============================================================================

  // 쿠폰 적용
  const applyCoupon = useCallback(
    (coupon: Coupon) => {
      const currentTotal = calculateCartTotalWithCoupon().totalAfterDiscount;

      if (currentTotal < 10000 && coupon.discountType === 'percentage') {
        addNotification(
          'percentage 쿠폰은 10,000원 이상 구매 시 사용 가능합니다.',
          'error'
        );
        return;
      }

      setSelectedCoupon(coupon);
      addNotification('쿠폰이 적용되었습니다.', 'success');
    },
    [addNotification, calculateCartTotalWithCoupon]
  );

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
  }, [addNotification]);

  // ============================================================================
  // 관리자 - 쿠폰 관리 로직 (상품 관리는 features/products로 이동)
  // ============================================================================

  // 새 쿠폰 추가
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
    [coupons, addNotification]
  );

  // 쿠폰 삭제
  const deleteCoupon = useCallback(
    (couponCode: string) => {
      setCoupons((prev) => prev.filter((c) => c.code !== couponCode));
      if (selectedCoupon?.code === couponCode) {
        setSelectedCoupon(null);
      }
      addNotification('쿠폰이 삭제되었습니다.', 'success');
    },
    [selectedCoupon, addNotification]
  );

  // ============================================================================
  // 폼 제출 핸들러들 - 쿠폰 폼만 남음 (상품 폼은 ProductManagement에서 관리)
  // ============================================================================

  // 쿠폰 폼 제출
  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCoupon(couponForm);
    setCouponForm({
      name: '',
      code: '',
      discountType: 'amount',
      discountValue: 0,
    });
    setShowCouponForm(false);
  };

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
              // 쿠폰 관리 탭
              <section className='bg-white rounded-lg border border-gray-200'>
                <div className='p-6 border-b border-gray-200'>
                  <h2 className='text-lg font-semibold'>쿠폰 관리</h2>
                </div>
                <div className='p-6'>
                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    {coupons.map((coupon) => (
                      <div
                        key={coupon.code}
                        className='relative bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200'
                      >
                        <div className='flex justify-between items-start'>
                          <div className='flex-1'>
                            <h3 className='font-semibold text-gray-900'>
                              {coupon.name}
                            </h3>
                            <p className='text-sm text-gray-600 mt-1 font-mono'>
                              {coupon.code}
                            </p>
                            <div className='mt-2'>
                              <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-indigo-700'>
                                {coupon.discountType === 'amount'
                                  ? `${coupon.discountValue.toLocaleString()}원 할인`
                                  : `${coupon.discountValue}% 할인`}
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => deleteCoupon(coupon.code)}
                            variant='icon'
                          >
                            <svg
                              className='w-5 h-5'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                              />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center hover:border-gray-400 transition-colors'>
                      <Button
                        onClick={() => setShowCouponForm(!showCouponForm)}
                        variant='icon'
                        className='flex flex-col items-center'
                      >
                        <svg
                          className='w-8 h-8'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 4v16m8-8H4'
                          />
                        </svg>
                        <p className='mt-2 text-sm font-medium'>새 쿠폰 추가</p>
                      </Button>
                    </div>
                  </div>

                  {/* 쿠폰 추가 폼 */}
                  {showCouponForm && (
                    <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
                      <form onSubmit={handleCouponSubmit} className='space-y-4'>
                        <h3 className='text-md font-medium text-gray-900'>
                          새 쿠폰 생성
                        </h3>
                        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              쿠폰명
                            </label>
                            <input
                              type='text'
                              value={couponForm.name}
                              onChange={(e) =>
                                setCouponForm({
                                  ...couponForm,
                                  name: e.target.value,
                                })
                              }
                              className='w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border text-sm'
                              placeholder='신규 가입 쿠폰'
                              required
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              쿠폰 코드
                            </label>
                            <input
                              type='text'
                              value={couponForm.code}
                              onChange={(e) =>
                                setCouponForm({
                                  ...couponForm,
                                  code: e.target.value.toUpperCase(),
                                })
                              }
                              className='w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border text-sm font-mono'
                              placeholder='WELCOME2024'
                              required
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              할인 타입
                            </label>
                            <select
                              value={couponForm.discountType}
                              onChange={(e) =>
                                setCouponForm({
                                  ...couponForm,
                                  discountType: e.target.value as
                                    | 'amount'
                                    | 'percentage',
                                })
                              }
                              className='w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border text-sm'
                            >
                              <option value='amount'>정액 할인</option>
                              <option value='percentage'>정률 할인</option>
                            </select>
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              {couponForm.discountType === 'amount'
                                ? '할인 금액'
                                : '할인율(%)'}
                            </label>
                            <input
                              type='text'
                              value={
                                couponForm.discountValue === 0
                                  ? ''
                                  : couponForm.discountValue
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d+$/.test(value)) {
                                  setCouponForm({
                                    ...couponForm,
                                    discountValue:
                                      value === '' ? 0 : parseInt(value),
                                  });
                                }
                              }}
                              onBlur={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                if (couponForm.discountType === 'percentage') {
                                  if (value > 100) {
                                    addNotification(
                                      '할인율은 100%를 초과할 수 없습니다',
                                      'error'
                                    );
                                    setCouponForm({
                                      ...couponForm,
                                      discountValue: 100,
                                    });
                                  } else if (value < 0) {
                                    setCouponForm({
                                      ...couponForm,
                                      discountValue: 0,
                                    });
                                  }
                                } else {
                                  if (value > 100000) {
                                    addNotification(
                                      '할인 금액은 100,000원을 초과할 수 없습니다',
                                      'error'
                                    );
                                    setCouponForm({
                                      ...couponForm,
                                      discountValue: 100000,
                                    });
                                  } else if (value < 0) {
                                    setCouponForm({
                                      ...couponForm,
                                      discountValue: 0,
                                    });
                                  }
                                }
                              }}
                              className='w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border text-sm'
                              placeholder={
                                couponForm.discountType === 'amount'
                                  ? '5000'
                                  : '10'
                              }
                              required
                            />
                          </div>
                        </div>
                        <div className='flex justify-end gap-3'>
                          <Button
                            type='button'
                            onClick={() => setShowCouponForm(false)}
                            variant='ghost'
                            size='md'
                          >
                            취소
                          </Button>
                          <Button type='submit' variant='secondary' size='md'>
                            쿠폰 생성
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </section>
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

            {/* 장바구니 사이드바 (기존 코드 유지) */}
            <div className='lg:col-span-1'>
              <div className='sticky top-24 space-y-4'>
                {/* 장바구니 섹션 */}
                <section className='bg-white rounded-lg border border-gray-200 p-4'>
                  <h2 className='text-lg font-semibold mb-4 flex items-center'>
                    <svg
                      className='w-5 h-5 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
                      />
                    </svg>
                    장바구니
                  </h2>
                  {cart.length === 0 ? (
                    <div className='text-center py-8'>
                      <svg
                        className='w-16 h-16 text-gray-300 mx-auto mb-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={1}
                          d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
                        />
                      </svg>
                      <p className='text-gray-500 text-sm'>
                        장바구니가 비어있습니다
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      {cart.map((item) => {
                        const itemTotal = calculateItemTotal(item, cart);
                        const originalPrice =
                          item.product.price * item.quantity;
                        const hasDiscount = itemTotal < originalPrice;
                        const discountRate = hasDiscount
                          ? Math.round((1 - itemTotal / originalPrice) * 100)
                          : 0;

                        return (
                          <div
                            key={item.product.id}
                            className='border-b pb-3 last:border-b-0'
                          >
                            <div className='flex justify-between items-start mb-2'>
                              <h4 className='text-sm font-medium text-gray-900 flex-1'>
                                {item.product.name}
                              </h4>
                              <Button
                                onClick={() => removeFromCart(item.product.id)}
                                variant='icon'
                                className='ml-2'
                              >
                                <svg
                                  className='w-4 h-4'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M6 18L18 6M6 6l12 12'
                                  />
                                </svg>
                              </Button>
                            </div>
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center'>
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.product.id,
                                      item.quantity - 1
                                    )
                                  }
                                  className='w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100'
                                >
                                  <span className='text-xs'>−</span>
                                </button>
                                <span className='mx-3 text-sm font-medium w-8 text-center'>
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.product.id,
                                      item.quantity + 1
                                    )
                                  }
                                  className='w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100'
                                >
                                  <span className='text-xs'>+</span>
                                </button>
                              </div>
                              <div className='text-right'>
                                {hasDiscount && (
                                  <span className='text-xs text-red-500 font-medium block'>
                                    -{discountRate}%
                                  </span>
                                )}
                                <p className='text-sm font-medium text-gray-900'>
                                  {Math.round(itemTotal).toLocaleString()}원
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* 쿠폰 할인 섹션 */}
                {cart.length > 0 && (
                  <>
                    <section className='bg-white rounded-lg border border-gray-200 p-4'>
                      <div className='flex items-center justify-between mb-3'>
                        <h3 className='text-sm font-semibold text-gray-700'>
                          쿠폰 할인
                        </h3>
                        <Button variant='link' size='sm'>
                          쿠폰 등록
                        </Button>
                      </div>
                      {coupons.length > 0 && (
                        <select
                          className='w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500'
                          value={selectedCoupon?.code || ''}
                          onChange={(e) => {
                            const coupon = coupons.find(
                              (c) => c.code === e.target.value
                            );
                            if (coupon) applyCoupon(coupon);
                            else setSelectedCoupon(null);
                          }}
                        >
                          <option value=''>쿠폰 선택</option>
                          {coupons.map((coupon) => (
                            <option key={coupon.code} value={coupon.code}>
                              {coupon.name} (
                              {coupon.discountType === 'amount'
                                ? `${coupon.discountValue.toLocaleString()}원`
                                : `${coupon.discountValue}%`}
                              )
                            </option>
                          ))}
                        </select>
                      )}
                    </section>

                    {/* 결제 정보 섹션 */}
                    <section className='bg-white rounded-lg border border-gray-200 p-4'>
                      <h3 className='text-lg font-semibold mb-4'>결제 정보</h3>
                      <div className='space-y-2 text-sm'>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>상품 금액</span>
                          <span className='font-medium'>
                            {totals.totalBeforeDiscount.toLocaleString()}원
                          </span>
                        </div>
                        {totals.totalBeforeDiscount -
                          totals.totalAfterDiscount >
                          0 && (
                          <div className='flex justify-between text-red-500'>
                            <span>할인 금액</span>
                            <span>
                              -
                              {(
                                totals.totalBeforeDiscount -
                                totals.totalAfterDiscount
                              ).toLocaleString()}
                              원
                            </span>
                          </div>
                        )}
                        <div className='flex justify-between py-2 border-t border-gray-200'>
                          <span className='font-semibold'>결제 예정 금액</span>
                          <span className='font-bold text-lg text-gray-900'>
                            {totals.totalAfterDiscount.toLocaleString()}원
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={completeOrder}
                        variant='primary'
                        size='lg'
                        className='w-full mt-4 bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                      >
                        {totals.totalAfterDiscount.toLocaleString()}원 결제하기
                      </Button>

                      <div className='mt-3 text-xs text-gray-500 text-center'>
                        <p>* 실제 결제는 이루어지지 않습니다</p>
                      </div>
                    </section>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
