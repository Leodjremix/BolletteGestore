import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Calendar from "react-calendar";
import { Expense } from "./ExpensesManager";
import { House } from "./HousesManager";
import {
  BanknotesIcon,
  HomeModernIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import ChartsAnalysis from "./ChartsAnalysis";

export default function Overview() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [date, setDate] = useState(new Date());

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
  const getHouseMonthlyTotal = (houseId: number | null) => {
    return expenses
      .filter((e) => e.house_id === houseId && isCurrentMonth(e.date))
      .reduce((acc, curr) => acc + curr.amount, 0);
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
          {houses.map((house) => {
            const total = getHouseMonthlyTotal(house.id);
            return (
              <div key={house.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-500 font-medium text-sm mb-1">{house.name}</p>
                    <h3 className="text-2xl font-bold text-gray-800">€{total.toFixed(2)}</h3>
                  </div>
                  <div className="p-3 bg-blue-50 text-primary rounded-xl">
                    <HomeModernIcon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            );
          })}
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
            {recentActivities.map((expense) => {
              const isPaid = !!expense.payment_date;
              const isOverdue = !isPaid && expense.due_date && new Date(expense.due_date) < new Date();

              return (
                <div key={expense.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-50 bg-gray-50 hover:bg-gray-100/50 transition">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${isPaid ? 'bg-green-100 text-green-600' : isOverdue ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                      {isPaid ? <CheckCircleIcon className="w-6 h-6" /> : <ExclamationCircleIcon className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{expense.title}</p>
                      <p className="text-sm text-gray-500">{new Date(expense.date).toLocaleDateString()} • {expense.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">€{expense.amount.toFixed(2)}</p>
                    <p className={`text-xs font-medium ${isPaid ? 'text-green-600' : isOverdue ? 'text-red-600' : 'text-yellow-600'}`}>
                      {isPaid ? "Pagato" : isOverdue ? "Scaduto" : "Da Pagare"}
                    </p>
                  </div>
                </div>
              );
            })}
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

    </div>
  );
}
