import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export function Settings() {
  const { profile, updateProfile } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [formData, setFormData] = useState({
    businessName: profile?.business_name || '',
    businessType: profile?.business_type || '',
    phone: profile?.phone || '',
  });
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      business_name: formData.businessName,
      business_type: formData.businessType,
      phone: formData.phone,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">{t.settings.title}</h1>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {t.messages.profileUpdated}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{t.settings.profile}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.auth.businessName}
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.settings.businessType}
            </label>
            <select
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Type</option>
              <option value="shop">Shop</option>
              <option value="restaurant">Restaurant</option>
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.auth.phone}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="+92"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg"
          >
            {t.settings.saveChanges}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{t.settings.language}</h2>

        <div className="grid grid-cols-3 gap-4">
          {[
            { code: 'en', name: 'English' },
            { code: 'ur', name: 'اردو' },
            { code: 'ps', name: 'پښتو' },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code as 'en' | 'ur' | 'ps')}
              className={`p-4 rounded-lg font-medium transition-colors ${
                language === lang.code
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Account Information</h2>

        <div className="space-y-3 text-gray-700">
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">Subscription Tier:</span>
            <span className="capitalize">{profile?.subscription_tier}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">Account Created:</span>
            <span>{new Date(profile?.created_at || '').toLocaleDateString()}</span>
          </div>
          {profile?.subscription_tier !== 'free' && profile?.subscription_expiry && (
            <div className="flex justify-between">
              <span className="font-medium">Subscription Expires:</span>
              <span>{new Date(profile.subscription_expiry).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
