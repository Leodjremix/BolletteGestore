import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Expense, Category } from "./ExpensesManager";
import { House } from "./HousesManager";
import { Person } from "./PeopleManager";
import Modal from "./ui/Modal";
import { CheckCircleIcon, ClockIcon, PaperClipIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

interface GlobalArchiveProps {
  onEditExpense: (expense: Expense) => void;
}

export default function GlobalArchive({ onEditExpense }: GlobalArchiveProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filters
  const [filterHouse, setFilterHouse] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterPeriod, setFilterPeriod] = useState<string>(""); // YYYY-MM

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected Bill Modal
  const [selectedBill, setSelectedBill] = useState<Expense | null>(null);

  const fetchData = async () => {
    try {
      const [expData, hseData, pplData, catData] = await Promise.all([
        invoke<Expense[]>("get_expenses"),
        invoke<House[]>("get_houses"),
        invoke<Person[]>("get_people"),
        invoke<Category[]>("get_categories"),
      ]);
      setExpenses(expData);
      setHouses(hseData);
      setPeople(pplData);
      setCategories(catData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteExpense = async (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questa bolletta/spesa?")) {
      try {
        await invoke("delete_expense", { id });
        setSelectedBill(null);
        fetchData();
      } catch (err: any) {
        alert("Errore durante l'eliminazione: " + err.toString());
      }
    }
  };

  // Filter Logic
  const filteredExpenses = expenses.filter((expense) => {
    if (filterHouse && expense.house_id?.toString() !== filterHouse) return false;
    if (filterCategory && expense.category_id?.toString() !== filterCategory) return false;
    if (filterPeriod) {
      const d = new Date(expense.date);
      const expenseMonthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (expenseMonthYear !== filterPeriod) return false;
    }
    return true;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getHouseName = (id: number | null) => houses.find(h => h.id === id)?.name || "-";
  const getPersonName = (id: number | null) => people.find(p => p.id === id)?.name || "-";

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-100 min-h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Archivio Globale</h2>
        <p className="text-gray-500">Visualizza, filtra e ricerca tutte le fatture e bollette inserite a sistema.</p>
      </div>

      {/* Filters Bar */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Filtra per Immobile</label>
          <select
            value={filterHouse}
            onChange={(e) => { setFilterHouse(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tutti gli immobili</option>
            {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Filtra per Categoria</label>
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tutte le categorie</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mese Emissione</label>
          <input
            type="month"
            value={filterPeriod}
            onChange={(e) => { setFilterPeriod(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          onClick={() => { setFilterHouse(""); setFilterCategory(""); setFilterPeriod(""); setCurrentPage(1); }}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          Resetta Filtri
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm">
              <th className="py-4 px-4 font-semibold text-gray-600">Stato</th>
              <th className="py-4 px-4 font-semibold text-gray-600">Titolo & Categoria</th>
              <th className="py-4 px-4 font-semibold text-gray-600">Importo</th>
              <th className="py-4 px-4 font-semibold text-gray-600">Scadenza</th>
              <th className="py-4 px-4 font-semibold text-gray-600">Immobile</th>
              <th className="py-4 px-4 font-semibold text-gray-600 text-right">Allegato</th>
            </tr>
          </thead>
          <tbody>
            {paginatedExpenses.map((expense) => {
              const isPaid = !!expense.payment_date;
              const isOverdue = !isPaid && expense.due_date && new Date(expense.due_date) < new Date();

              return (
                <tr
                  key={expense.id}
                  onClick={() => setSelectedBill(expense)}
                  className="border-b border-gray-50 hover:bg-blue-50/50 transition cursor-pointer group"
                >
                  <td className="py-3 px-4">
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircleIcon className="w-4 h-4" /> Pagato
                      </span>
                    ) : isOverdue ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <ClockIcon className="w-4 h-4" /> Scaduto
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        <ClockIcon className="w-4 h-4" /> Da Pagare
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900 group-hover:text-primary transition-colors">{expense.title}</p>
                    <p className="text-xs text-gray-500">{expense.category_name || "Non categorizzata"}</p>
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-900">€{expense.amount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {expense.due_date ? new Date(expense.due_date).toLocaleDateString() : "-"}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {getHouseName(expense.house_id)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {expense.attachment_path ? (
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md inline-block">
                        <PaperClipIcon className="w-4 h-4" />
                      </div>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {paginatedExpenses.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500 bg-gray-50/50">
                  Nessun documento trovato con i filtri attuali.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">Pagina {currentPage} di {totalPages}</p>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Precedente
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Successiva
            </button>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      <Modal isOpen={!!selectedBill} onClose={() => setSelectedBill(null)} title="Dettaglio Bolletta">
        {selectedBill && (
          <div className="space-y-4 text-gray-700">
            <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between border border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedBill.title}</h3>
                <p className="text-sm text-gray-500">{selectedBill.category_name || "Nessuna categoria"}</p>
              </div>
              <p className="text-2xl font-bold text-primary">€{selectedBill.amount.toFixed(2)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Emissione</p>
                <p className="font-medium">{new Date(selectedBill.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Scadenza</p>
                <p className="font-medium">{selectedBill.due_date ? new Date(selectedBill.due_date).toLocaleDateString() : "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pagamento</p>
                <p className="font-medium">{selectedBill.payment_date ? new Date(selectedBill.payment_date).toLocaleDateString() : "Non pagato"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Periodo</p>
                <p className="font-medium">{selectedBill.period || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">N. Fattura</p>
                <p className="font-medium">{selectedBill.invoice_number || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Codice Cliente</p>
                <p className="font-medium">{selectedBill.client_code || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Immobile</p>
                <p className="font-medium">{getHouseName(selectedBill.house_id)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Intestatario</p>
                <p className="font-medium">{getPersonName(selectedBill.person_id)}</p>
              </div>
            </div>

            {selectedBill.notes && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Note</p>
                <p className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm whitespace-pre-wrap">{selectedBill.notes}</p>
              </div>
            )}

            {selectedBill.attachment_path && (
              <div className="mt-4 flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3 text-blue-700">
                  <PaperClipIcon className="w-5 h-5" />
                  <span className="text-sm font-medium truncate max-w-[200px]">{selectedBill.attachment_path.split(/[/\\]/).pop()}</span>
                </div>
                <span className="text-xs text-blue-500">Percorso Locale (Protetto)</span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEditExpense(selectedBill)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition"
                >
                  <PencilIcon className="w-4 h-4" /> Modifica
                </button>
                <button
                  onClick={() => handleDeleteExpense(selectedBill.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl font-medium hover:bg-red-100 transition"
                >
                  <TrashIcon className="w-4 h-4" /> Elimina
                </button>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                Chiudi
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
