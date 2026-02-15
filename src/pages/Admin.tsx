import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { Plus, Trash2 } from 'lucide-react';

interface UserStats {
  totalUsers: number;
  totalRevenue: number;
  activeSubscriptions: number;
}

interface CouponData {
  code: string;
  discountAmount: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  expiryDate: string | null;
}

export function Admin() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<UserStats>({ totalUsers: 0, totalRevenue: 0, activeSubscriptions: 0 });
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountAmount: 50,
    usageLimit: 100,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadAdminData();
    }
  }, [profile]);

  const loadAdminData = async () => {
    const { data: profiles } = await supabase.from('profiles').select('id, subscription_tier');
    const { data: subscriptions } = await supabase.from('subscriptions').select('amount, payment_status');
    const { data: couponsList } = await supabase.from('coupons').select('*').eq('is_active', true);

    let revenue = 0;
    let activeCount = 0;

    (subscriptions || []).forEach((sub: { amount: number; payment_status: string }) => {
      if (sub.payment_status === 'completed') {
        revenue += sub.amount;
        activeCount += 1;
      }
    });

    setStats({
      totalUsers: (profiles || []).length,
      totalRevenue: revenue,
      activeSubscriptions: activeCount,
    });

    setCoupons(
      (couponsList || []).map((c: any) => ({
        code: c.code,
        discountAmount: c.discount_amount,
        usageLimit: c.usage_limit,
        usedCount: c.used_count,
        isActive: c.is_active,
        expiryDate: c.expiry_date,
      }))
    );

    setLoading(false);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('coupons').insert({
      code: couponForm.code.toUpperCase(),
      discount_amount: couponForm.discountAmount,
      usage_limit: couponForm.usageLimit,
      is_active: true,
      expiry_date: couponForm.expiryDate,
    });

    if (!error) {
      setCouponForm({
        code: '',
        discountAmount: 50,
        usageLimit: 100,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      setShowCouponForm(false);
      await loadAdminData();
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (confirm(t.common.confirm)) {
      await supabase.from('coupons').update({ is_active: false }).eq('code', code);
      await loadAdminData();
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-bold">Access Denied: Admin only</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12">{t.common.loading}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">{t.admin.title}</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-600 mb-2">{t.admin.totalUsers}</p>
          <p className="text-4xl font-bold text-blue-600">{stats.totalUsers}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-600 mb-2">{t.admin.totalRevenue}</p>
          <p className="text-4xl font-bold text-green-600">
            {t.common.currency} {stats.totalRevenue}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-600 mb-2">{t.admin.activeSubscriptions}</p>
          <p className="text-4xl font-bold text-purple-600">{stats.activeSubscriptions}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">{t.admin.coupons}</h2>
          <button
            onClick={() => setShowCouponForm(!showCouponForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            <Plus className="w-5 h-5" />
            {t.admin.createCoupon}
          </button>
        </div>

        {showCouponForm && (
          <form onSubmit={handleCreateCoupon} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.subscription.couponCode}
              </label>
              <input
                type="text"
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="WELCOME50"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.subscription.discount}
                </label>
                <input
                  type="number"
                  value={couponForm.discountAmount}
                  onChange={(e) => setCouponForm({ ...couponForm, discountAmount: parseInt(e.target.value) })}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.admin.usageLimit}
                </label>
                <input
                  type="number"
                  value={couponForm.usageLimit}
                  onChange={(e) => setCouponForm({ ...couponForm, usageLimit: parseInt(e.target.value) })}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.admin.expiryDate}
                </label>
                <input
                  type="date"
                  value={couponForm.expiryDate}
                  onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowCouponForm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-lg"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg"
              >
                {t.admin.createCoupon}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {coupons.map((coupon) => (
            <div key={coupon.code} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-bold text-gray-800">{coupon.code}</p>
                <p className="text-sm text-gray-600">
                  Discount: {coupon.discountAmount} PKR | Used: {coupon.usedCount}/{coupon.usageLimit}
                </p>
                {coupon.expiryDate && (
                  <p className="text-sm text-gray-600">
                    Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDeleteCoupon(coupon.code)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {coupons.length === 0 && (
          <p className="text-center py-8 text-gray-500">No coupons yet</p>
        )}
      </div>
    </div>
  );
}
