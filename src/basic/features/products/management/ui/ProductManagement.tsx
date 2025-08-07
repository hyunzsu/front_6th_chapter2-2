import { FormEvent, useState } from 'react';
import { ProductWithUI } from '../../../../entities/product';
import { Button } from '../../../../shared/ui';
import { useProducts } from '../hooks';

interface ProductManagementProps {
  products: ProductWithUI[];
  setProducts: React.Dispatch<React.SetStateAction<ProductWithUI[]>>;
  formatPrice: (price: number, productId?: string) => string;
  addNotification: (
    message: string,
    type?: 'error' | 'success' | 'warning'
  ) => void;
}

export default function ProductManagement({
  products,
  setProducts,
  formatPrice,
  addNotification,
}: ProductManagementProps) {
  const { addProduct, updateProduct, deleteProduct } = useProducts({
    products,
    setProducts,
    addNotification,
  });

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: 0,
    stock: 0,
    description: '',
    discounts: [] as Array<{ quantity: number; rate: number }>,
  });

  const handleProductSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editingProduct && editingProduct !== 'new') {
      updateProduct(editingProduct, productForm);
      setEditingProduct(null);
    } else {
      addProduct(productForm);
    }
    setProductForm({
      name: '',
      price: 0,
      stock: 0,
      description: '',
      discounts: [],
    });
    setEditingProduct(null);
    setShowProductForm(false);
  };

  const startEditProduct = (product: ProductWithUI) => {
    setEditingProduct(product.id);
    setProductForm({
      name: product.name,
      price: product.price,
      stock: product.stock,
      description: product.description || '',
      discounts: product.discounts || [],
    });
    setShowProductForm(true);
  };

  return (
    <section className='bg-white rounded-lg border border-gray-200'>
      <div className='p-6 border-b border-gray-200'>
        <div className='flex justify-between items-center'>
          <h2 className='text-lg font-semibold'>상품 목록</h2>
          <Button
            onClick={() => {
              setEditingProduct('new');
              setProductForm({
                name: '',
                price: 0,
                stock: 0,
                description: '',
                discounts: [],
              });
              setShowProductForm(true);
            }}
            variant='primary'
            size='md'
          >
            새 상품 추가
          </Button>
        </div>
      </div>

      {/* 상품 목록 테이블 */}
      <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead className='bg-gray-50 border-b border-gray-200'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                상품명
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                가격
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                재고
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                설명
              </th>
              <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                작업
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {products.map((product) => (
              <tr key={product.id} className='hover:bg-gray-50'>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                  {product.name}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                  {formatPrice(product.price, product.id)}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.stock > 10
                        ? 'bg-green-100 text-green-800'
                        : product.stock > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.stock}개
                  </span>
                </td>
                <td className='px-6 py-4 text-sm text-gray-500 max-w-xs truncate'>
                  {product.description || '-'}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                  <Button
                    onClick={() => startEditProduct(product)}
                    variant='link'
                    className='mr-3'
                  >
                    수정
                  </Button>
                  <Button
                    onClick={() => deleteProduct(product.id)}
                    variant='danger'
                  >
                    삭제
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 상품 추가/편집 폼 */}
      {showProductForm && (
        <div className='p-6 border-t border-gray-200 bg-gray-50'>
          <form onSubmit={handleProductSubmit} className='space-y-4'>
            <h3 className='text-lg font-medium text-gray-900'>
              {editingProduct === 'new' ? '새 상품 추가' : '상품 수정'}
            </h3>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  상품명
                </label>
                <input
                  type='text'
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      name: e.target.value,
                    })
                  }
                  className='w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  설명
                </label>
                <input
                  type='text'
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      description: e.target.value,
                    })
                  }
                  className='w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  가격
                </label>
                <input
                  type='text'
                  value={productForm.price === 0 ? '' : productForm.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      setProductForm({
                        ...productForm,
                        price: value === '' ? 0 : parseInt(value),
                      });
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setProductForm({ ...productForm, price: 0 });
                    } else if (parseInt(value) < 0) {
                      addNotification('가격은 0보다 커야 합니다', 'error');
                      setProductForm({ ...productForm, price: 0 });
                    }
                  }}
                  className='w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border'
                  placeholder='숫자만 입력'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  재고
                </label>
                <input
                  type='text'
                  value={productForm.stock === 0 ? '' : productForm.stock}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      setProductForm({
                        ...productForm,
                        stock: value === '' ? 0 : parseInt(value),
                      });
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setProductForm({ ...productForm, stock: 0 });
                    } else if (parseInt(value) < 0) {
                      addNotification('재고는 0보다 커야 합니다', 'error');
                      setProductForm({ ...productForm, stock: 0 });
                    } else if (parseInt(value) > 9999) {
                      addNotification(
                        '재고는 9999개를 초과할 수 없습니다',
                        'error'
                      );
                      setProductForm({ ...productForm, stock: 9999 });
                    }
                  }}
                  className='w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border'
                  placeholder='숫자만 입력'
                  required
                />
              </div>
            </div>

            {/* 할인 정책 관리 */}
            <div className='mt-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                할인 정책
              </label>
              <div className='space-y-2'>
                {productForm.discounts.map((discount, index) => (
                  <div
                    key={index}
                    className='flex items-center gap-2 bg-gray-50 p-2 rounded'
                  >
                    <input
                      type='number'
                      value={discount.quantity}
                      onChange={(e) => {
                        const newDiscounts = [...productForm.discounts];
                        newDiscounts[index].quantity =
                          parseInt(e.target.value) || 0;
                        setProductForm({
                          ...productForm,
                          discounts: newDiscounts,
                        });
                      }}
                      className='w-20 px-2 py-1 border rounded'
                      min='1'
                      placeholder='수량'
                    />
                    <span className='text-sm'>개 이상 구매 시</span>
                    <input
                      type='number'
                      value={discount.rate * 100}
                      onChange={(e) => {
                        const newDiscounts = [...productForm.discounts];
                        newDiscounts[index].rate =
                          (parseInt(e.target.value) || 0) / 100;
                        setProductForm({
                          ...productForm,
                          discounts: newDiscounts,
                        });
                      }}
                      className='w-16 px-2 py-1 border rounded'
                      min='0'
                      max='100'
                      placeholder='%'
                    />
                    <span className='text-sm'>% 할인</span>
                    <Button
                      type='button'
                      onClick={() => {
                        const newDiscounts = productForm.discounts.filter(
                          (_, i) => i !== index
                        );
                        setProductForm({
                          ...productForm,
                          discounts: newDiscounts,
                        });
                      }}
                      variant='danger'
                      size='sm'
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
                ))}
                <Button
                  type='button'
                  onClick={() => {
                    setProductForm({
                      ...productForm,
                      discounts: [
                        ...productForm.discounts,
                        { quantity: 10, rate: 0.1 },
                      ],
                    });
                  }}
                  variant='link'
                  size='md'
                >
                  + 할인 추가
                </Button>
              </div>
            </div>

            <div className='flex justify-end gap-3'>
              <Button
                type='button'
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    name: '',
                    price: 0,
                    stock: 0,
                    description: '',
                    discounts: [],
                  });
                  setShowProductForm(false);
                }}
                variant='ghost'
                size='md'
              >
                취소
              </Button>
              <Button type='submit' variant='secondary' size='md'>
                {editingProduct === 'new' ? '추가' : '수정'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
