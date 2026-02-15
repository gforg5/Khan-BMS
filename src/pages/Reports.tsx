import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { BarChart3, TrendingUp } from 'lucide-react';

interface SalesData {
  date: string;
  total: number;
  count: number;
}

interface ProductSalesData {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

export function Reports() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productSales, setProductSales] = useState<ProductSalesData[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user, reportType]);

  const loadReports = async () => {
    if (!user) return;

    const now = new Date();
    let startDate = new Date();

    if (reportType === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (reportType === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const { data: sales } = await supabase
      .from('sales')
      .select('id, total_amount, profit, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    const { data: saleItems } = await supabase
      .from('sale_items')
      .select('product_id, quantity, subtotal')
      .in(
        'sale_id',
        (sales || []).map((s: { id: string }) => s.id)
      );

    const { data: products } = await supabase
      .from('products')
      .select('id, name_en, name_ur, name_ps')
      .eq('user_id', user.id);

    let total = 0;
    let profit = 0;
    const salesByDate: { [key: string]: SalesData } = {};

    (sales || []).forEach((sale: { total_amount: number; profit: number; created_at: string }) => {
      total += sale.total_amount;
      profit += sale.profit;

      const date = new Date(sale.created_at).toLocaleDateString();
      if (!salesByDate[date]) {
        salesByDate[date] = { date, total: 0, count: 0 };
      }
      salesByDate[date].total += sale.total_amount;
      salesByDate[date].count += 1;
    });

    const productMap: { [key: string]: ProductSalesData } = {};
    (saleItems || []).forEach((item: { product_id: string; quantity: number; subtotal: number }) => {
      if (!productMap[item.product_id]) {
        const product = (products || []).find((p: { id: string }) => p.id === item.product_id);
        productMap[item.product_id] = {
          productId: item.product_id,
          productName: product?.name_en || 'Unknown',
          quantity: 0,
          revenue: 0,
        };
      }
      productMap[item.product_id].quantity += item.quantity;
      productMap[item.product_id].revenue += item.subtotal;
    });

    setSalesData(Object.values(salesByDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setProductSales(Object.values(productMap).sort((a, b) => b.revenue - a.revenue));
    setTotalSales(total);
    setTotalProfit(profit);
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-12">{t.common.loading}</div>;
  }

  const canAccessAdvanced = () => {
    if (profile?.subscription_tier === 'free') return false;
    if (profile?.subscription_expiry && new Date(profile.subscription_expiry) < new Date()) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">{t.reports.title}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex gap-2">
          {['daily', 'weekly', 'monthly'].map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type as 'daily' | 'weekly' | 'monthly')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                reportType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {type === 'daily'
                ? t.reports.dailyReport
                : type === 'weekly'
                  ? t.reports.weeklyReport
                  : t.reports.monthlyReport}
            </button>
          ))}
        </div>
      </div>

      {!canAccessAdvanced() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Limited analytics. Upgrade to see detailed reports.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">{t.reports.salesTrends}</h2>
          </div>
          {salesData.length > 0 ? (
            <div className="space-y-3">
              {salesData.map((data) => (
                <div key={data.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">{data.date}</p>
                    <p className="text-sm text-gray-600">{data.count} transactions</p>
                  </div>
                  <p className="font-bold text-green-600">
                    {t.common.currency} {data.total.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">No sales data</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-800">{t.reports.bestSellers}</h2>
          </div>
          {productSales.length > 0 ? (
            <div className="space-y-3">
              {productSales.slice(0, 5).map((product) => (
                <div key={product.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">{product.productName}</p>
                    <p className="text-sm text-gray-600">Sold: {product.quantity} units</p>
                  </div>
                  <p className="font-bold text-blue-600">
                    {t.common.currency} {product.revenue.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">No sales data</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-600 mb-2">{t.reports.revenue}</p>
          <p className="text-3xl font-bold text-blue-600">
            {t.common.currency} {totalSales.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-600 mb-2">{t.dashboard.totalProfit}</p>
          <p className="text-3xl font-bold text-green-600">
            {t.common.currency} {totalProfit.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-600 mb-2">Transactions</p>
          <p className="text-3xl font-bold text-purple-600">
            {salesData.reduce((sum, d) => sum + d.count, 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
