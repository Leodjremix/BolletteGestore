import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Calendar from "react-calendar";
import { Expense } from "./ExpensesManager";
import { House } from "./HousesManager";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import ChartsAnalysis from "./ChartsAnalysis";
import HouseCard from "./ui/HouseCard";
import BillListItem from "./ui/BillListItem";
import Modal from "./ui/Modal";

export default function Overview() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [date, setDate] = useState(new Date());

  // Modals state for interaction preview
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [selectedBill, setSelectedBill] = useState<Expense | null>(null);

  const fetchData = async () => {
    try {
      const [expData, hseData] = await Promise.all([
        invoke<Expense[]>("get_expenses"),
        invoke<House[]>("get_houses"),
      ]);
      setExpenses(expData);
      setHouses(hseData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calcolo spese del mese corrente (basato sulla data di emissione)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const isCurrentMonth = (dateString: string) => {
    const d = new Date(dateString);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  // 1. Top Level: Riepilogo spese per abitazione (Mese Corrente)
  const getUnpaidBillsCountForHouse = (houseId: number) => {
    return expenses.filter((e) => e.house_id === houseId && !e.payment_date).length;
  };

  // Calcolo totale generico (per le spese non associate ad abitazioni o totale assoluto)
  const totalMonthlyExpenses = expenses
    .filter((e) => isCurrentMonth(e.date))
    .reduce((acc, curr) => acc + curr.amount, 0);

  // 2. Mid Level: Ultime Attività
  const recentActivities = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // 3. Calendario: Evidenziare scadenze
  const unpaidDeadlines = expenses.filter(
    (e) => !e.payment_date && e.due_date
  );

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const isDeadline = unpaidDeadlines.some((e) => {
        const dueDate = new Date(e.due_date!);
        return (
          dueDate.getDate() === date.getDate() &&
          dueDate.getMonth() === date.getMonth() &&
          dueDate.getFullYear() === date.getFullYear()
        );
      });
      return isDeadline ? "deadline-day" : null;
    }
    return null;
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const dayDeadlines = unpaidDeadlines.filter((e) => {
        const dueDate = new Date(e.due_date!);
        return (
          dueDate.getDate() === date.getDate() &&
          dueDate.getMonth() === date.getMonth() &&
          dueDate.getFullYear() === date.getFullYear()
        );
      });

      if (dayDeadlines.length > 0) {
        return (
          <div className="text-[10px] font-bold text-red-600 mt-1 truncate">
            {dayDeadlines.length} da pagare
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* HEADER: Cards Abitazioni */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Riepilogo Mese Corrente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

          {/* Card Totale Assoluto */}
          <div className="bg-gradient-to-br from-primary to-blue-600 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-blue-100 font-medium mb-1">Spese Totali (Questo mese)</p>
              <h3 className="text-3xl font-bold">€{totalMonthlyExpenses.toFixed(2)}</h3>
            </div>
            <BanknotesIcon className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10" />
          </div>

          {/* Cards Abitazioni */}
          {houses.map((house) => (
            <HouseCard
              key={house.id}
              alias={house.name}
              city={house.city || undefined}
              street={house.address || undefined}
              unpaidBillsCount={getUnpaidBillsCountForHouse(house.id)}
              onClick={() => setSelectedHouse(house)}
            />
          ))}
        </div>
      </div>

      {/* LOWER SECTION: Ultime attività & Calendario */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Ultime Attività */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">Ultime Attività</h3>
          </div>

          <div className="space-y-4">
            {recentActivities.map((expense) => (
              <BillListItem
                key={expense.id}
                title={expense.title}
                category={expense.category_name || "Altro"}
                date={expense.date}
                dueDate={expense.due_date}
                paymentDate={expense.payment_date}
                amount={expense.amount}
                onClick={() => setSelectedBill(expense)}
              />
            ))}
            {recentActivities.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nessuna attività recente.</p>
            )}
          </div>
        </div>

        {/* Calendario Scadenze */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
          <h3 className="text-lg font-bold text-gray-800 mb-6 w-full text-left">Scadenze</h3>
          <div className="w-full max-w-sm">
            <Calendar
              onChange={(val) => setDate(val as Date)}
              value={date}
              tileClassName={tileClassName}
              tileContent={tileContent}
              className="w-full border-none shadow-none rounded-xl"
            />
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 w-full">
            <h4 className="text-sm font-semibold text-gray-600 mb-3">Da pagare in questo giorno:</h4>
            <ul className="space-y-2">
              {unpaidDeadlines
                .filter(e => {
                  const d = new Date(e.due_date!);
                  return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
                })
                .map(e => (
                  <li key={e.id} className="flex justify-between text-sm items-center">
                    <span className="text-gray-800 font-medium truncate pr-2">{e.title}</span>
                    <span className="text-red-600 font-bold whitespace-nowrap">€{e.amount.toFixed(2)}</span>
                  </li>
                ))
              }
              {unpaidDeadlines.filter(e => {
                  const d = new Date(e.due_date!);
                  return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
              }).length === 0 && (
                <li className="text-sm text-gray-400">Nessuna scadenza.</li>
              )}
            </ul>
          </div>
        </div>

      </div>

      {/* Advanced Charts Section */}
      <ChartsAnalysis />

      {/* Modals for Interaction Preview */}
      <Modal isOpen={!!selectedHouse} onClose={() => setSelectedHouse(null)} title={`Dettagli ${selectedHouse?.name}`}>
        <div className="text-gray-600">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-1">Città</p>
              <p className="font-medium text-gray-900">{selectedHouse?.city || "Non specificata"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-1">Indirizzo</p>
              <p className="font-medium text-gray-900">{selectedHouse?.address || "Non specificato"}</p>
            </div>
          </div>

          <h4 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">Statistiche e Bollette (Sempre)</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
              <span className="font-medium text-blue-800">Spesa Totale Storica</span>
              <span className="font-bold text-blue-900">
                €{expenses.filter(e => e.house_id === selectedHouse?.id).reduce((a, b) => a + b.amount, 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-100">
              <span className="font-medium text-red-800">Da Pagare in Scadenza</span>
              <span className="font-bold text-red-900">
                {selectedHouse && getUnpaidBillsCountForHouse(selectedHouse.id)}
              </span>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Ultime 3 Spese Associate</h4>
            <ul className="space-y-2">
              {expenses
                .filter(e => e.house_id === selectedHouse?.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 3)
                .map(exp => (
                  <li key={exp.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                    <div>
                      <p className="font-medium text-gray-800">{exp.title}</p>
                      <p className="text-xs text-gray-500">{new Date(exp.date).toLocaleDateString()}</p>
                    </div>
                    <span className="font-bold text-gray-900">€{exp.amount.toFixed(2)}</span>
                  </li>
              ))}
              {expenses.filter(e => e.house_id === selectedHouse?.id).length === 0 && (
                <li className="text-sm text-gray-400">Nessuna spesa associata a questo immobile.</li>
              )}
            </ul>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!selectedBill} onClose={() => setSelectedBill(null)} title={`Dettaglio Bolletta`}>
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
                <p className="font-medium">
                  {selectedBill.payment_date
                    ? <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-md">{new Date(selectedBill.payment_date).toLocaleDateString()}</span>
                    : <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-md">Da Saldare</span>
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Consumo</p>
                <p className="font-medium">{selectedBill.consumption ? `${selectedBill.consumption}` : "-"}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col gap-2">
              <p className="text-xs text-gray-500 text-center">
                Per modificare lo stato di pagamento o alterare la bolletta, utilizza la tabella completa nella scheda <strong>"Archivio Bollette"</strong>.
              </p>
              <button
                onClick={() => setSelectedBill(null)}
                className="mt-2 w-full py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition"
              >
                Chiudi Visualizzazione
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
