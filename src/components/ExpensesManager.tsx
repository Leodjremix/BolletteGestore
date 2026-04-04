import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Person } from "./PeopleManager";
import { House } from "./HousesManager";

export interface Expense {
  id: number;
  amount: number;
  date: string;
  category: string;
  invoice_number: string | null;
  person_id: number | null;
  house_id: number | null;
  attachment_path: string | null;
}

export default function ExpensesManager() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [houses, setHouses] = useState<House[]>([]);

  // Form State
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("Bollette");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [personId, setPersonId] = useState("");
  const [houseId, setHouseId] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [expData, pplData, hseData] = await Promise.all([
        invoke<Expense[]>("get_expenses"),
        invoke<Person[]>("get_people"),
        invoke<House[]>("get_houses"),
      ]);
      setExpenses(expData);
      setPeople(pplData);
      setHouses(hseData);
    } catch (err: any) {
      setError(err.toString());
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectAttachment = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Documenti e Immagini',
          extensions: ['pdf', 'png', 'jpeg', 'jpg']
        }]
      });
      if (selected && typeof selected === 'string') {
        setAttachment(selected);
      }
    } catch (err: any) {
      setError("Errore nella selezione del file: " + err.toString());
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isNaN(parseFloat(amount))) {
      setError("Importo non valido");
      return;
    }

    try {
      await invoke("add_expense", {
        amount: parseFloat(amount),
        date,
        category,
        invoiceNumber: invoiceNumber || null,
        personId: personId ? parseInt(personId) : null,
        houseId: houseId ? parseInt(houseId) : null,
        attachmentPath: attachment,
      });

      // Reset Form
      setAmount("");
      setInvoiceNumber("");
      setAttachment(null);
      fetchData();
    } catch (err: any) {
      setError(err.toString());
    }
  };

  const getPersonName = (id: number | null) => people.find(p => p.id === id)?.name || "-";
  const getHouseName = (id: number | null) => houses.find(h => h.id === id)?.name || "-";

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestione Spese</h2>

      <form onSubmit={handleAddExpense} className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Nuova Spesa</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Importo (€)*</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Data*</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Categoria*</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="Bollette">Bollette (Luce/Gas)</option>
              <option value="Assicurazioni">Assicurazioni</option>
              <option value="Tasse">Tasse</option>
              <option value="Manutenzione">Manutenzione</option>
              <option value="Altro">Altro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">N. Fattura / Scontrino</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Persona Associata</label>
            <select
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">-- Nessuna --</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Immobile Associato</label>
            <select
              value={houseId}
              onChange={(e) => setHouseId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">-- Nessuno --</option>
              {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={handleSelectAttachment}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
          >
            Allega File
          </button>
          <span className="text-sm text-gray-500 truncate max-w-xs">
            {attachment ? attachment.split(/[/\\]/).pop() : "Nessun file allegato"}
          </span>
        </div>

        {error && <div className="text-red-500 mt-4 text-sm">{error}</div>}

        <div className="mt-6">
          <button
            type="submit"
            className="bg-primary hover:bg-blue-600 text-white font-semibold py-2 px-8 rounded-lg transition shadow-md"
          >
            Salva Spesa
          </button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm">
              <th className="py-3 px-4 font-semibold text-gray-600">Data</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Categoria</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Importo</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Persona</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Immobile</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Allegato</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                <td className="py-3 px-4 text-gray-800">{expense.date}</td>
                <td className="py-3 px-4 text-gray-600">{expense.category}</td>
                <td className="py-3 px-4 font-semibold text-gray-800">€{expense.amount.toFixed(2)}</td>
                <td className="py-3 px-4 text-gray-600">{getPersonName(expense.person_id)}</td>
                <td className="py-3 px-4 text-gray-600">{getHouseName(expense.house_id)}</td>
                <td className="py-3 px-4 text-gray-500">
                  {expense.attachment_path ? "Sì" : "-"}
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  Nessuna spesa registrata
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
