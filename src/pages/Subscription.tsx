import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { Check } from 'lucide-react';

interface SubscriptionData {
  tier: 'free' | 'standard' | 'premium';
  expiryDate: string | null;
  amount: number;
  couponCode: string | null;
}

export function Subscription() {
  const { user, profile, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [selectedTier, setSelectedTier] = useState<'free' | 'standard' | 'premium'>('free');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user && profile) {
      loadSubscriptionData();
    }
  }, [user, profile]);

  const loadSubscriptionData = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (data) {
      setSubscriptionData({
        tier: data.tier,
        expiryDate: data.expiry_date,
        amount: data.amount,
        couponCode: data.coupon_code,
      });
      setSelectedTier(data.tier);
    } else if (profile) {
      setSelectedTier(profile.subscription_tier);
    }
    setLoading(false);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode || selectedTier === 'free') return;

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      setMessage(t.messages.invalidCoupon);
      return;
    }

    if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
      setMessage(t.messages.invalidCoupon);
      return;
    }

    setDiscount(data.discount_amount);
    setCouponApplied(true);
    setMessage(t.messages.couponApplied);
  };

  const tierPrices = {
    free: 0,
    standard: 200,
    premium: 500,
  };

  const getFinalPrice = () => {
    return Math.max(0, tierPrices[selectedTier] - discount);
  };

  const handleUpgrade = async () => {
    if (!user) return;

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    await updateProfile({
      subscription_tier: selectedTier,
      subscription_expiry: selectedTier !== 'free' ? expiryDate.toISOString() : null,
    });

    if (selectedTier !== 'free') {
      await supabase.from('subscriptions').insert({
        user_id: user.id,
        tier: selectedTier,
        amount: getFinalPrice(),
        coupon_code: couponApplied ? couponCode.toUpperCase() : null,
        payment_status: 'completed',
        start_date: new Date().toISOString(),
        expiry_date: expiryDate.toISOString(),
      });

      if (couponApplied && couponCode) {
        await supabase.rpc('increment', {
          table_name: 'coupons',
          row_id: couponCode,
          column_name: 'used_count',
        }).catch(() => {});
      }
    }

    setMessage('Subscription updated successfully!');
    await loadSubscriptionData();
  };

  if (loading) {
    return <div className="text-center py-12">{t.common.loading}</div>;
  }

  const tiers = [
    {
      id: 'free' as const,
      name: t.subscription.free,
      price: 0,
      features: [
        'Limited dashboard',
        '10 products max',
        'Basic sales tracking',
        '7-day analytics only',
        'Read-only reports',
      ],
    },
    {
      id: 'standard' as const,
      name: t.subscription.standard,
      price: 200,
      features: [
        'Full dashboard',
        '500 products',
        'Daily/weekly/monthly analytics',
        'Inventory tracking',
        'Sales reports',
        'Expense tracking',
      ],
    },
    {
      id: 'premium' as const,
      name: t.subscription.premium,
      price: 500,
      features: [
        'Unlimited products',
        'Advanced analytics',
        'All Standard features',
        'Priority support',
        'Custom branding',
        'Bulk export',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">{t.subscription.title}</h1>
        <p className="text-gray-600 mt-2">
          {t.subscription.currentPlan}: <span className="font-semibold capitalize">{profile?.subscription_tier}</span>
        </p>
        {profile?.subscription_expiry && profile.subscription_tier !== 'free' && (
          <p className="text-gray-600">
            {t.subscription.expiresOn}: {new Date(profile.subscription_expiry).toLocaleDateString()}
          </p>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('successfully') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-blue-50 border border-blue-200 text-blue-700'}`}>
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`rounded-xl p-6 border-2 transition-all ${
              selectedTier === tier.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{tier.name}</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {tier.price} {t.common.currency}
                </p>
                {tier.id !== 'free' && <p className="text-sm text-gray-600">/month</p>}
              </div>
              {selectedTier === tier.id && <Check className="w-6 h-6 text-blue-600" />}
            </div>

            <ul className="space-y-2 mb-6">
              {tier.features.map((feature, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => setSelectedTier(tier.id)}
              className={`w-full py-2 rounded-lg font-medium transition-colors ${
                selectedTier === tier.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {selectedTier === tier.id ? 'Selected' : 'Select'}
            </button>
          </div>
        ))}
      </div>

      {selectedTier !== 'free' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t.subscription.applyCoupon}</h2>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder={t.subscription.couponCode}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={couponApplied}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={couponApplied || !couponCode}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
            >
              {couponApplied ? 'Applied' : t.common.confirm}
            </button>
          </div>

          {couponApplied && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">
                {t.subscription.discount}: {discount} {t.common.currency}
              </p>
            </div>
          )}

          <div className="space-y-2 mb-6">
            <div className="flex justify-between">
              <span>{selectedTier === 'standard' ? t.subscription.standardPrice : t.subscription.premiumPrice}:</span>
              <span>{tierPrices[selectedTier]} {t.common.currency}</span>
            </div>
            {couponApplied && (
              <div className="flex justify-between text-green-600">
                <span>{t.subscription.discount}:</span>
                <span>-{discount} {t.common.currency}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>{t.sales.total}:</span>
              <span>{getFinalPrice()} {t.common.currency}</span>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleUpgrade}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg"
      >
        {t.subscription.upgrade}
      </button>
    </div>
  );
}
