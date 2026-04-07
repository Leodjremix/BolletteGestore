import { useState } from "react";
import PeopleManager from "./PeopleManager";
import HousesManager from "./HousesManager";
import ExpensesManager from "./ExpensesManager";
import EnergyAnalysis from "./EnergyAnalysis";
import Overview from "./Overview";
import GlobalArchive from "./GlobalArchive";
import SettingsManager from "./SettingsManager";
import { Expense } from "./ExpensesManager";
import { useTheme } from "./ThemeProvider";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "archive" | "expenses" | "people" | "houses" | "energy" | "settings">("overview");
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const { theme, toggleTheme } = useTheme();

  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setActiveTab("expenses");
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 w-full transition-colors">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Gestore Spese</h1>
          <button onClick={toggleTheme} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            {theme === "light" ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              activeTab === "overview" ? "bg-blue-50 text-primary font-semibold dark:bg-gray-700/50 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("archive")}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              activeTab === "archive" ? "bg-blue-50 text-primary font-semibold dark:bg-gray-700/50 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750"
            }`}
          >
            Archivio Bollette
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              activeTab === "expenses" ? "bg-blue-50 text-primary font-semibold dark:bg-gray-700/50 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750"
            }`}
          >
            Nuovo Inserimento
          </button>
          <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-700"></div>
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Impostazioni Base</p>
          <button
            onClick={() => setActiveTab("people")}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              activeTab === "people" ? "bg-blue-50 text-primary font-semibold dark:bg-gray-700/50 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750"
            }`}
          >
            Persone
          </button>
          <button
            onClick={() => setActiveTab("houses")}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              activeTab === "houses" ? "bg-blue-50 text-primary font-semibold dark:bg-gray-700/50 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750"
            }`}
          >
            Abitazioni
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              activeTab === "settings" ? "bg-blue-50 text-primary font-semibold dark:bg-gray-700/50 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750"
            }`}
          >
            Impostazioni Categorie
          </button>
          <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-700"></div>
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Avanzato</p>
          <button
            onClick={() => setActiveTab("energy")}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              activeTab === "energy" ? "bg-blue-50 text-primary font-semibold dark:bg-gray-700/50 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750"
            }`}
          >
            Analisi Energetica
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {activeTab === "overview" && <Overview />}
        {activeTab === "archive" && <GlobalArchive onEditExpense={handleEditExpense} />}
        {activeTab === "expenses" && (
          <ExpensesManager
            initialExpense={expenseToEdit}
            onClearInitial={() => setExpenseToEdit(null)}
          />
        )}
        {activeTab === "people" && <PeopleManager />}
        {activeTab === "houses" && <HousesManager />}
        {activeTab === "settings" && <SettingsManager />}
        {activeTab === "energy" && <EnergyAnalysis />}
      </div>
    </div>
  );
}
