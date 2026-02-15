import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, ShoppingBag, Calendar } from 'lucide-react';

interface Stats {
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
  totalProfit: number;
  totalLoss: number;
  lowStockCount: number;
}

interface TopProduct {
  name: string;
  totalSold: number;
  revenue: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  quantity: number;
  threshold: number;
}

export function Dashboard() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats>({ todaySales: 0, weeklySales: 0, monthlySales: 0, totalProfit: 0, totalLoss: 0, lowStockCount: 0 });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const { data: sales } = await supabase.from('sales').select('total_amount, profit, created_at').eq('user_id', user.id);
    const { data: expenses } = await supabase.from('expenses').select('amount, expense_date').eq('user_id', user.id);
    const { data: products } = await supabase.from('products').select('id, name_en, quantity, low_stock_threshold').eq('user_id', user.id);
    const { data: saleItems } = await supabase.from('sale_items').select('product_id, quantity, subtotal, sale_id').in('sale_id', (sales || []).map((s: { id: string }) => s.id));

    let todaySales = 0,
      weeklySales = 0,
      monthlySales = 0,
      totalProfit = 0;

    (sales || []).forEach((sale: { created_at: string; total_amount: number; profit: number }) => {
      const saleDate = new Date(sale.created_at);
      const amount = sale.total_amount;
      const profit = sale.profit;

      if (saleDate >= today) todaySales += amount;
      if (saleDate >= weekAgo) weeklySales += amount;
      if (saleDate >= monthAgo) monthlySales += amount;
      totalProfit += profit;
    });

    let totalLoss = 0;
    (expenses || []).forEach((expense: { amount: number }) => {
      totalLoss += expense.amount;
    });

    const lowStock: LowStockProduct[] = (products || [])
      .filter((p: { quantity: number; low_stock_threshold: number }) => p.quantity <= p.low_stock_threshold)
      .map((p: { id: string; name_en: string; quantity: number; low_stock_threshold: number }) => ({
        id: p.id,
        name: p.name_en,
        quantity: p.quantity,
        threshold: p.low_stock_threshold,
      }));

    const productSales: { [key: string]: { name: string; totalSold: number; revenue: number } } = {};
    (saleItems || []).forEach((item: { product_id: string; quantity: number; subtotal: number }) => {
      const product = (products || []).find((p: { id: string }) => p.id === item.product_id);
      if (product) {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { name: product.name_en, totalSold: 0, revenue: 0 };
        }
        productSales[item.product_id].totalSold += item.quantity;
        productSales[item.product_id].revenue += item.subtotal;
      }
    });

    const topProds = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setStats({ todaySales, weeklySales, monthlySales, totalProfit, totalLoss, lowStockCount: lowStock.length });
    setTopProducts(topProds);
    setLowStockProducts(lowStock);
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-12">{t.common.loading}</div>;
  }

  const canAccessFeature = () => {
    if (profile?.subscription_tier === 'free') return false;
    if (profile?.subscription_expiry && new Date(profile.subscription_expiry) < new Date()) return false;
    return true;
  };

  const StatCard = ({ title, value, icon: Icon, color, currency = true }: { title: string; value: number; icon: React.ElementType; color: string; currency?: boolean }) => (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-gray-800">
        {currency && `${t.common.currency} `}
        {value.toLocaleString()}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t.dashboard.title}</h1>
        <p className="text-gray-600">
          {t.subscription.currentPlan}: <span className="font-semibold capitalize">{profile?.subscription_tier}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title={t.dashboard.todaySales} value={stats.todaySales} icon={Calendar} color="text-blue-600" />
        <StatCard title={t.dashboard.weeklySales} value={canAccessFeature() ? stats.weeklySales : 0} icon={TrendingUp} color="text-green-600" />
        <StatCard title={t.dashboard.monthlySales} value={canAccessFeature() ? stats.monthlySales : 0} icon={ShoppingBag} color="text-purple-600" />
        <StatCard title={t.dashboard.totalProfit} value={stats.totalProfit} icon={DollarSign} color="text-green-600" />
        <StatCard title={t.dashboard.totalLoss} value={stats.totalLoss} icon={TrendingDown} color="text-red-600" />
        <StatCard title={t.dashboard.lowStock} value={stats.lowStockCount} icon={AlertTriangle} color="text-yellow-600" currency={false} />
      </div>

      {!canAccessFeature() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            {profile?.subscription_tier === 'free' ? 'Upgrade to Standard or Premium to access full analytics' : 'Your subscription has expired. Please renew to continue accessing premium features.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t.dashboard.topProducts}</h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-600">Sold: {product.totalSold} units</p>
                  </div>
                  <p className="font-bold text-green-600">{t.common.currency} {product.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t.dashboard.lowStock}</h2>
          {lowStockProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">All products are well stocked</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      Current: {product.quantity} / Alert at: {product.threshold}
                    </p>
                  </div>
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
