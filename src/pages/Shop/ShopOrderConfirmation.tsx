import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type Props = {
  shopId: number;
  shopName: string;
};

// Responsive confirmation page for Shop Orders (mirrors merchant confirmation style)
const ShopOrderConfirmation: React.FC<Props> = ({ shopId, shopName }) => {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const orderId: string | undefined = location?.state?.orderId;
  const total: number | undefined = location?.state?.total;

  const goToShopHome = () => navigate(`/shop${shopId}`);
  const viewOrders = () => navigate('/orders');
  const continueShopping = () => navigate(`/shop${shopId}-allproductpage`);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 shrink-0 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Order placed successfully</h2>
                <p className="text-sm text-gray-600">Thanks for shopping at {shopName}. We'll send updates as your items ship.</p>
              </div>
            </div>
          </div>

          {(orderId || total) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
              {orderId && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Order ID</p>
                  <p className="mt-1 font-semibold text-gray-900 break-all">{orderId}</p>
                </div>
              )}
              {typeof total === 'number' && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Order Total</p>
                  <p className="mt-1 font-semibold text-gray-900">₹{total.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={goToShopHome}
              className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors"
            >
              Go to {shopName}
            </button>
            <button
              onClick={continueShopping}
              className="w-full sm:w-auto px-5 py-2.5 border border-primary-200 rounded-lg text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
            >
              Continue Shopping
            </button>
            <button
              onClick={viewOrders}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors"
            >
              View Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopOrderConfirmation;
