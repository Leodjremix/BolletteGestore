import { useState } from "react";
import PeopleManager from "./PeopleManager";
import HousesManager from "./HousesManager";
import ExpensesManager from "./ExpensesManager";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "people" | "houses" | "expenses">("people");

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 w-full">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">Gestore Spese</h1>
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
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {activeTab === "overview" && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Panoramica</h2>
            <p className="text-gray-600">Benvenuto nella dashboard principale. Qui in futuro ci saranno grafici e statistiche.</p>
          </div>
        )}
        {activeTab === "people" && <PeopleManager />}
        {activeTab === "houses" && <HousesManager />}
        {activeTab === "expenses" && <ExpensesManager />}
      </div>
    </div>
  );
}
