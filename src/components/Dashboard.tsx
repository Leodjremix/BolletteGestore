import { useState } from "react";
import PeopleManager from "./PeopleManager";
import HousesManager from "./HousesManager";
import ExpensesManager from "./ExpensesManager";
import EnergyAnalysis from "./EnergyAnalysis";
import Overview from "./Overview";
import { useTheme } from "./ThemeProvider";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "people" | "houses" | "expenses" | "energy">("overview");
  const { theme, toggleTheme } = useTheme();

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
              activeTab === "overview" ? "bg-blue-50 text-primary font-semibold" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("people")}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              activeTab === "people" ? "bg-blue-50 text-primary font-semibold" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Persone
          </button>
          <button
            onClick={() => setActiveTab("houses")}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              activeTab === "houses" ? "bg-blue-50 text-primary font-semibold" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Abitazioni
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              activeTab === "expenses" ? "bg-blue-50 text-primary font-semibold" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Spese e Documenti
          </button>
          <button
            onClick={() => setActiveTab("energy")}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              activeTab === "energy" ? "bg-blue-50 text-primary font-semibold" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Analisi Energetica
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {activeTab === "overview" && <Overview />}
        {activeTab === "people" && <PeopleManager />}
        {activeTab === "houses" && <HousesManager />}
        {activeTab === "expenses" && <ExpensesManager />}
        {activeTab === "energy" && <EnergyAnalysis />}
      </div>
    </div>
  );
}
