import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { PlusIcon, PaperClipIcon, CheckCircleIcon, ClockIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import Modal from "./ui/Modal";
import { Person } from "./PeopleManager";
import { House } from "./HousesManager";

export interface Category {
  id: number;
  name: string;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  date: string;
  due_date: string | null;
  payment_date: string | null;
  period: string | null;
  client_code: string | null;
  consumption: number | null;
  category_id: number | null;
  category_name: string | null;
  invoice_number: string | null;
  person_id: number | null;
  house_id: number | null;
  attachment_path: string | null;
  notes: string | null;
  created_by: number | null;
}

export default function ExpensesManager() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [period, setPeriod] = useState("");
  const [clientCode, setClientCode] = useState("");
  const [consumption, setConsumption] = useState("");
  const [categoryId, setCategoryId] = useState(""); // ID categoria
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [personId, setPersonId] = useState("");
  const [houseId, setHouseId] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [expData, pplData, hseData, catData] = await Promise.all([
        invoke<Expense[]>("get_expenses"),
        invoke<Person[]>("get_people"),
        invoke<House[]>("get_houses"),
        invoke<Category[]>("get_categories"),
      ]);
      setExpenses(expData);
      setPeople(pplData);
      setHouses(hseData);
      setCategories(catData);
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

  const handleEditClick = (expense: Expense) => {
    setEditingId(expense.id);
    setTitle(expense.title);
    setAmount(expense.amount.toString());
    setDate(expense.date);
    setDueDate(expense.due_date || "");
    setPaymentDate(expense.payment_date || "");
    setPeriod(expense.period || "");
    setClientCode(expense.client_code || "");
    setConsumption(expense.consumption ? expense.consumption.toString() : "");
    setCategoryId(expense.category_id ? expense.category_id.toString() : "");
    setInvoiceNumber(expense.invoice_number || "");
    setPersonId(expense.person_id ? expense.person_id.toString() : "");
    setHouseId(expense.house_id ? expense.house_id.toString() : "");
    setAttachment(expense.attachment_path);
    setNotes(expense.notes || "");
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questa spesa?")) {
      try {
        await invoke("delete_expense", { id });
        fetchData();
      } catch (err: any) {
        alert("Errore durante l'eliminazione: " + err.toString());
      }
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
      const payload = {
        title,
        amount: parseFloat(amount),
        date,
        dueDate: dueDate || null,
        paymentDate: paymentDate || null,
        period: period || null,
        clientCode: clientCode || null,
        consumption: consumption ? parseFloat(consumption) : null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        invoiceNumber: invoiceNumber || null,
        personId: personId ? parseInt(personId) : null,
        houseId: houseId ? parseInt(houseId) : null,
        attachmentPath: attachment,
        notes: notes || null,
      };

      if (editingId) {
        await invoke("update_expense", { id: editingId, ...payload });
      } else {
        await invoke("add_expense", payload);
      }

      // Reset Form
      setEditingId(null);
      setTitle("");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setDueDate("");
      setPaymentDate("");
      setPeriod("");
      setClientCode("");
      setConsumption("");
      setCategoryId("");
      setInvoiceNumber("");
      setPersonId("");
      setHouseId("");
      setAttachment(null);
      setNotes("");
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.toString());
    }
  };

  const getPersonName = (id: number | null) => people.find(p => p.id === id)?.name || "-";
  const getHouseName = (id: number | null) => houses.find(h => h.id === id)?.name || "-";

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Spese e Documenti</h2>
        <button
          onClick={() => {
            setEditingId(null);
            setTitle("");
            setAmount("");
            setDate(new Date().toISOString().split("T")[0]);
            setDueDate("");
            setPaymentDate("");
            setPeriod("");
            setClientCode("");
            setConsumption("");
            setCategoryId("");
            setInvoiceNumber("");
            setPersonId("");
            setHouseId("");
            setAttachment(null);
            setNotes("");
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-xl transition shadow-md"
        >
          <PlusIcon className="w-5 h-5" />
          Nuova Spesa
        </button>
      </div>

      {/* Modal Inserimento */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Modifica Spesa" : "Aggiungi Nuova Spesa"}>
        <form onSubmit={handleAddExpense} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Titolo / Causale*</label>
              <input
                type="text"
                placeholder="es. Bolletta Enel, Affitto, Assicurazione..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
              />
              <p className="text-xs text-gray-500 mt-1">La categoria verrà assegnata automaticamente in base al titolo (es. "Enel" &rarr; Bolletta Luce).</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Importo (€)*</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Emissione*</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Scadenza</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Pagamento</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consumo (kWh o Smc)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Opzionale (solo bollette)"
                value={consumption}
                onChange={(e) => setConsumption(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria (Opzionale)</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
              >
                <option value="">-- Seleziona Categoria --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N. Bolletta / Fattura</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Periodo di Riferimento</label>
              <input
                type="text"
                placeholder="es. Gen-Feb 2024"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Codice Cliente</label>
              <input
                type="text"
                value={clientCode}
                onChange={(e) => setClientCode(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Persona Associata</label>
              <select
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
              >
                <option value="">-- Nessuna --</option>
                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Immobile Associato</label>
              <select
                value={houseId}
                onChange={(e) => setHouseId(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
              >
                <option value="">-- Nessuno --</option>
                {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (Opzionali)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
                placeholder="Aggiungi dettagli extra..."
              ></textarea>
            </div>

            {/* Allegato */}
            <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <PaperClipIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Documento Allegato</p>
                  <p className="text-xs text-gray-500 truncate max-w-xs">
                    {attachment ? attachment.split(/[/\\]/).pop() : "Nessun file selezionato"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSelectAttachment}
                className="text-sm bg-white hover:bg-gray-50 text-blue-600 font-medium py-1.5 px-4 rounded-lg border border-blue-200 transition shadow-sm"
              >
                Sfoglia
              </button>
            </div>
          </div>

          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="bg-primary hover:bg-blue-600 text-white font-semibold py-2.5 px-8 rounded-xl transition shadow-md"
            >
              Salva
            </button>
          </div>
        </form>
      </Modal>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm">
              <th className="py-4 px-4 font-semibold text-gray-600">Stato</th>
              <th className="py-4 px-4 font-semibold text-gray-600">Titolo & Categoria</th>
              <th className="py-4 px-4 font-semibold text-gray-600">Importo</th>
              <th className="py-4 px-4 font-semibold text-gray-600">Scadenza</th>
              <th className="py-4 px-4 font-semibold text-gray-600">Riferimento</th>
              <th className="py-4 px-4 font-semibold text-gray-600">Allegato</th>
              <th className="py-4 px-4 font-semibold text-gray-600 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => {
              const isPaid = !!expense.payment_date;
              const isOverdue = !isPaid && expense.due_date && new Date(expense.due_date) < new Date();

              return (
                <tr key={expense.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
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
                    <p className="font-medium text-gray-900">{expense.title}</p>
                    <p className="text-xs text-gray-500">{expense.category_name || "Non categorizzata"}</p>
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-900">€{expense.amount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {expense.due_date ? new Date(expense.due_date).toLocaleDateString() : "-"}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {getHouseName(expense.house_id)} <br />
                    {getPersonName(expense.person_id)}
                  </td>
                  <td className="py-3 px-4">
                    {expense.attachment_path ? (
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md inline-block">
                        <PaperClipIcon className="w-4 h-4" />
                      </div>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEditClick(expense)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteClick(expense.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500 bg-gray-50/50">
                  Nessuna spesa o documento registrato. Clicca su "Nuova Spesa" per iniziare.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
