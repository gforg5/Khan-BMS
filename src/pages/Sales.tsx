import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

interface SaleItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  profit: number;
}

export function Sales() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    if (!user) return;

    const { data } = await supabase.from('products').select('*').eq('user_id', user.id).gt('quantity', 0).order('name_en');

    if (data) {
      setProducts(data);
    }
  };

  const getProductName = (product: Product) => {
    if (language === 'ur' && product.name_ur) return product.name_ur;
    if (language === 'ps' && product.name_ps) return product.name_ps;
    return product.name_en;
  };

  const handleAddItem = () => {
    if (!selectedProductId || quantity <= 0) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    if (quantity > product.quantity) {
      alert('Insufficient stock');
      return;
    }

    const existingItem = saleItems.find((item) => item.product.id === product.id);
    if (existingItem) {
      setSaleItems(
        saleItems.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * product.selling_price,
                profit: (item.quantity + quantity) * (product.selling_price - product.purchase_price),
              }
            : item
        )
      );
    } else {
      setSaleItems([
        ...saleItems,
        {
          product,
          quantity,
          unitPrice: product.selling_price,
          subtotal: quantity * product.selling_price,
          profit: quantity * (product.selling_price - product.purchase_price),
        },
      ]);
    }

    setSelectedProductId('');
    setQuantity(1);
  };

  const handleRemoveItem = (productId: string) => {
    setSaleItems(saleItems.filter((item) => item.product.id !== productId));
  };

  const getTotalAmount = () => saleItems.reduce((sum, item) => sum + item.subtotal, 0);
  const getTotalProfit = () => saleItems.reduce((sum, item) => sum + item.profit, 0);

  const handleCompleteSale = async () => {
    if (saleItems.length === 0 || !user) return;

    setLoading(true);

    const receiptNumber = `RCP-${Date.now()}`;

    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({
        user_id: user.id,
        total_amount: getTotalAmount(),
        profit: getTotalProfit(),
        payment_method: paymentMethod,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        receipt_number: receiptNumber,
      })
      .select()
      .single();

    if (saleError || !saleData) {
      alert('Error recording sale');
      setLoading(false);
      return;
    }

    const saleItemsData = saleItems.map((item) => ({
      sale_id: saleData.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.subtotal,
      profit: item.profit,
    }));

    await supabase.from('sale_items').insert(saleItemsData);

    for (const item of saleItems) {
      await supabase.from('products').update({ quantity: item.product.quantity - item.quantity }).eq('id', item.product.id);
    }

    alert(`${t.messages.saleRecorded}\nReceipt: ${receiptNumber}`);

    setSaleItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setPaymentMethod('cash');
    await loadProducts();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">{t.sales.newSale}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{t.sales.addItem}</h2>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.sales.selectProduct}</label>
            <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">{t.sales.selectProduct}</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {getProductName(product)} - {t.common.currency} {product.selling_price} (Stock: {product.quantity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.sales.quantity}</label>
            <div className="flex gap-2">
              <input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} min="1" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              <button onClick={handleAddItem} disabled={!selectedProductId} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {saleItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            <ShoppingCart className="inline w-6 h-6 mr-2" />
            Cart
          </h2>

          <div className="space-y-3 mb-6">
            {saleItems.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{getProductName(item.product)}</h3>
                  <p className="text-sm text-gray-600">
                    {item.quantity} x {t.common.currency} {item.unitPrice} = {t.common.currency} {item.subtotal}
                  </p>
                </div>
                <button onClick={() => handleRemoveItem(item.product.id)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-lg">
              <span className="font-medium">{t.sales.total}:</span>
              <span className="font-bold text-gray-800">
                {t.common.currency} {getTotalAmount().toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t.sales.profit}:</span>
              <span className="font-semibold text-green-600">
                {t.common.currency} {getTotalProfit().toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.sales.paymentMethod}</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'online')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="cash">{t.sales.cash}</option>
                <option value="card">{t.sales.card}</option>
                <option value="online">{t.sales.online}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.sales.customerName} ({t.common.info})
              </label>
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.sales.customerPhone} ({t.common.info})
            </label>
            <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="+92" />
          </div>

          <button onClick={handleCompleteSale} disabled={loading} className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg disabled:opacity-50">
            {loading ? t.common.loading : t.sales.generateReceipt}
          </button>
        </div>
      )}

      {saleItems.length === 0 && <div className="text-center py-12 text-gray-500">Add products to cart to record a sale</div>}
    </div>
  );
}
