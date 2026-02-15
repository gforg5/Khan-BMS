import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { Plus, Trash2 } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Expense = Database['public']['Tables']['expenses']['Row'];

export function Expenses() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    category: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user]);

  const loadExpenses = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('expense_date', { ascending: false });

    if (data) {
      setExpenses(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from('expenses').insert({
      ...formData,
      user_id: user.id,
      amount: parseFloat(formData.amount.toString()),
    });

    if (!error) {
      await loadExpenses();
      setFormData({
        description: '',
        amount: 0,
        category: '',
        expense_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setShowForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t.common.confirm)) {
      await supabase.from('expenses').delete().eq('id', id);
      await loadExpenses();
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (loading) {
    return <div className="text-center py-12">{t.common.loading}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">{t.expenses.title}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="w-5 h-5" />
          {t.expenses.addExpense}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="text-center">
          <p className="text-gray-600">{t.expenses.totalExpenses}</p>
          <p className="text-4xl font-bold text-red-600">
            {t.common.currency} {totalExpenses.toLocaleString()}
          </p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">{t.expenses.addExpense}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.expenses.description}
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.expenses.amount}
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.expenses.category}
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.expenses.date}
              </label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.expenses.notes}
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-lg"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg"
              >
                {t.common.save}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {expenses.map((expense) => (
          <div key={expense.id} className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{expense.description}</h3>
              <p className="text-sm text-gray-600">
                {expense.category && `${expense.category} • `}
                {new Date(expense.expense_date).toLocaleDateString()}
              </p>
              {expense.notes && <p className="text-sm text-gray-500 mt-1">{expense.notes}</p>}
            </div>
            <div className="flex items-center gap-4">
              <p className="font-bold text-red-600">{t.common.currency} {expense.amount}</p>
              <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-700">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {expenses.length === 0 && (
        <div className="text-center py-12 text-gray-500">No expenses recorded yet</div>
      )}
    </div>
  );
}
