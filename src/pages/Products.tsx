import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];

export function Products() {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<ProductInsert>>({
    name_en: '',
    name_ur: '',
    name_ps: '',
    purchase_price: 0,
    selling_price: 0,
    quantity: 0,
    unit: 'piece',
    category: '',
    supplier: '',
    low_stock_threshold: 10,
  });

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    if (!user) return;

    const { data, error } = await supabase.from('products').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

    if (!error && data) {
      const limit = profile?.subscription_tier === 'free' ? 10 : profile?.subscription_tier === 'standard' ? 500 : 999999;
      setProducts(data.slice(0, limit));
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const productData = { ...formData, user_id: user.id };

    if (editingProduct) {
      await supabase.from('products').update(productData).eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert([productData as ProductInsert]);
    }

    await loadProducts();
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm(t.common.confirm)) {
      await supabase.from('products').delete().eq('id', id);
      await loadProducts();
    }
  };

  const resetForm = () => {
    setFormData({ name_en: '', name_ur: '', name_ps: '', purchase_price: 0, selling_price: 0, quantity: 0, unit: 'piece', category: '', supplier: '', low_stock_threshold: 10 });
    setEditingProduct(null);
    setShowForm(false);
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowForm(true);
  };

  const getProductName = (product: Product) => {
    if (language === 'ur' && product.name_ur) return product.name_ur;
    if (language === 'ps' && product.name_ps) return product.name_ps;
    return product.name_en;
  };

  const filteredProducts = products.filter((p) => getProductName(p).toLowerCase().includes(searchTerm.toLowerCase()));

  const canAddMore = () => {
    if (profile?.subscription_tier === 'free' && products.length >= 10) return false;
    if (profile?.subscription_tier === 'standard' && products.length >= 500) return false;
    return true;
  };

  if (loading) {
    return <div className="text-center py-12">{t.common.loading}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">{t.products.title}</h1>
        <button onClick={() => setShowForm(true)} disabled={!canAddMore()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50">
          <Plus className="w-5 h-5" />
          {t.products.addProduct}
        </button>
      </div>

      {!canAddMore() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">You have reached the product limit for your plan. Upgrade to add more products.</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t.common.search} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{editingProduct ? t.products.editProduct : t.products.addProduct}</h2>
              <button onClick={resetForm}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.nameInEnglish}</label>
                <input type="text" value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.nameInUrdu}</label>
                  <input type="text" value={formData.name_ur || ''} onChange={(e) => setFormData({ ...formData, name_ur: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" dir="rtl" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.nameInPashto}</label>
                  <input type="text" value={formData.name_ps || ''} onChange={(e) => setFormData({ ...formData, name_ps: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" dir="rtl" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.purchasePrice}</label>
                  <input type="number" value={formData.purchase_price} onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) })} required min="0" step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.sellingPrice}</label>
                  <input type="number" value={formData.selling_price} onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) })} required min="0" step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.quantity}</label>
                  <input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })} required min="0" step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.unit}</label>
                  <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="piece">Piece</option>
                    <option value="kg">Kilogram</option>
                    <option value="liter">Liter</option>
                    <option value="meter">Meter</option>
                    <option value="box">Box</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.lowStockThreshold}</label>
                  <input type="number" value={formData.low_stock_threshold} onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseFloat(e.target.value) })} min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.category}</label>
                  <input type="text" value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.supplier}</label>
                  <input type="text" value={formData.supplier || ''} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={resetForm} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-lg">
                  {t.common.cancel}
                </button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg">
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const profit = product.selling_price - product.purchase_price;
          const profitMargin = product.purchase_price > 0 ? ((profit / product.purchase_price) * 100).toFixed(1) : 0;
          const isLowStock = product.quantity <= product.low_stock_threshold;

          return (
            <div key={product.id} className={`bg-white rounded-lg shadow-md p-4 border-2 ${isLowStock ? 'border-yellow-400' : 'border-transparent'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{getProductName(product)}</h3>
                  {product.category && <p className="text-sm text-gray-500">{product.category}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(product)} className="text-blue-600 hover:text-blue-700">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.products.quantity}:</span>
                  <span className={`font-semibold ${isLowStock ? 'text-yellow-600' : 'text-gray-800'}`}>
                    {product.quantity} {product.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.products.sellingPrice}:</span>
                  <span className="font-semibold text-gray-800">
                    {t.common.currency} {product.selling_price}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.products.profitMargin}:</span>
                  <span className={`font-semibold ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>{profitMargin}%</span>
                </div>
              </div>

              {isLowStock && <div className="mt-3 bg-yellow-50 text-yellow-800 text-xs px-2 py-1 rounded">{t.products.lowStockAlert}</div>}
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && <div className="text-center py-12 text-gray-500">{searchTerm ? 'No products found' : 'No products yet. Add your first product!'}</div>}
    </div>
  );
}
