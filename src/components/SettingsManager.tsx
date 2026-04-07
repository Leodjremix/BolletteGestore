import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TrashIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { Category, Expense } from "./ExpensesManager";

export default function SettingsManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [catData, expData] = await Promise.all([
        invoke<Category[]>("get_categories"),
        invoke<Expense[]>("get_expenses"),
      ]);
      setCategories(catData);
      setExpenses(expData);
    } catch (err: any) {
      setError(err.toString());
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await invoke("add_category", { name: newCategoryName.trim().toUpperCase() });
      setNewCategoryName("");
      fetchData();
    } catch (err: any) {
      setError("Errore o categoria già esistente.");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questa categoria?")) {
      try {
        await invoke("delete_category", { id });
        fetchData();
      } catch (err: any) {
        setError(err.toString());
      }
    }
  };

  const getCategoryTotal = (categoryId: number) => {
    return expenses
      .filter((e) => e.category_id === categoryId)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 min-h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Impostazioni Categorie</h2>
        <p className="text-gray-500 dark:text-gray-400">Aggiungi, rimuovi e visualizza le statistiche delle categorie di spesa.</p>
      </div>

      {error && <div className="text-red-500 mb-6 text-sm bg-red-50 p-4 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form */}
        <div className="md:col-span-1">
          <form onSubmit={handleAddCategory} className="bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Nuova Categoria</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Categoria</label>
              <input
                type="text"
                placeholder="es. ASSICURAZIONI AUTO"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary uppercase transition"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition shadow-sm"
            >
              Aggiungi
            </button>
          </form>
        </div>

        {/* List */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 text-sm">
                  <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Nome Categoria</th>
                  <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Totale Storico</th>
                  <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => {
                  const total = getCategoryTotal(cat.id);
                  return (
                    <tr key={cat.id} className="border-b border-gray-100 dark:border-gray-750 hover:bg-gray-50 dark:hover:bg-gray-750/50 transition">
                      <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">{cat.name}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1.5 font-bold text-gray-900 dark:text-gray-100">
                          <ChartBarIcon className="w-4 h-4 text-primary" />
                          €{total.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
