import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { UserPlus, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

type SubscriptionTier = 'free' | 'standard' | 'premium';

export function Register({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('free');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const { t } = useLanguage();

  const tierPrices = { free: 0, standard: 200, premium: 500 };

  const handleApplyCoupon = async () => {
    if (!couponCode || selectedTier === 'free') return;

    const { data, error } = await supabase.from('coupons').select('*').eq('code', couponCode.toUpperCase()).eq('is_active', true).maybeSingle();

    if (error || !data) {
      setError(t.messages.invalidCoupon);
      return;
    }

    if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
      setError(t.messages.invalidCoupon);
      return;
    }

    setDiscount(data.discount_amount);
    setCouponApplied(true);
    setError('');
  };

  const getFinalPrice = () => Math.max(0, tierPrices[selectedTier] - discount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signUpError } = await signUp(email, password, businessName, phone);

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setLoading(false);
      return;
    }

    const expiryDate = new Date();
    if (selectedTier === 'standard' || selectedTier === 'premium') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    await supabase.from('profiles').update({ subscription_tier: selectedTier, subscription_expiry: selectedTier !== 'free' ? expiryDate.toISOString() : null }).eq('id', authData.user.id);

    if (selectedTier !== 'free') {
      await supabase.from('subscriptions').insert({
        user_id: authData.user.id,
        tier: selectedTier,
        amount: getFinalPrice(),
        coupon_code: couponApplied ? couponCode.toUpperCase() : null,
        payment_status: 'completed',
        start_date: new Date().toISOString(),
        expiry_date: expiryDate.toISOString(),
      });
    }

    setLoading(false);
  };

  const tiers = [
    { id: 'free' as SubscriptionTier, name: t.subscription.free, price: 0, features: t.subscription.freeFeatures },
    { id: 'standard' as SubscriptionTier, name: t.subscription.standard, price: 200, features: t.subscription.standardFeatures },
    { id: 'premium' as SubscriptionTier, name: t.subscription.premium, price: 500, features: t.subscription.premiumFeatures },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl">
        <div className="flex items-center justify-center mb-6">
          <UserPlus className="w-12 h-12 text-blue-600" />
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">{t.common.appName}</h1>
        <p className="text-center text-gray-600 mb-8">{t.auth.register}</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {tiers.map((tier) => (
            <button
              key={tier.id}
              type="button"
              onClick={() => setSelectedTier(tier.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${selectedTier === tier.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg">{tier.name}</h3>
                {selectedTier === tier.id && <Check className="w-5 h-5 text-blue-600" />}
              </div>
              <p className="text-2xl font-bold text-blue-600 mb-2">{tier.price} {t.common.currency}</p>
              <p className="text-sm text-gray-600">{tier.features}</p>
            </button>
          ))}
        </div>

        {selectedTier !== 'free' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.subscription.applyCoupon}</label>
            <div className="flex gap-2">
              <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder={t.subscription.couponCode} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" disabled={couponApplied} />
              <button type="button" onClick={handleApplyCoupon} disabled={couponApplied || !couponCode} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
                {couponApplied ? t.messages.couponApplied : t.common.confirm}
              </button>
            </div>
            {couponApplied && <p className="mt-2 text-green-600 text-sm">{t.subscription.discount}: {discount} {t.common.currency}</p>}
            <p className="mt-2 text-lg font-bold">{t.common.currency} {getFinalPrice()}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.businessName}</label>
              <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.phone}</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="+92" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.email}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.password}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50">
            {loading ? t.common.loading : t.auth.signUp}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          {t.auth.alreadyHaveAccount}{' '}
          <button onClick={onSwitchToLogin} className="text-blue-600 hover:text-blue-700 font-medium">
            {t.auth.login}
          </button>
        </p>
      </div>
    </div>
  );
}
