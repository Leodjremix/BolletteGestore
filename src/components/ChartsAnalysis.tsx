import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Expense } from "./ExpensesManager";

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899'];

export default function ChartsAnalysis() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const fetchExpenses = async () => {
    try {
      const data = await invoke<Expense[]>("get_expenses");
      setExpenses(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Prepare data for Monthly Bar Chart
  const getMonthlyData = () => {
    const monthlyMap: Record<string, number> = {};
    expenses.forEach((e) => {
      const d = new Date(e.date);
      const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[monthYear] = (monthlyMap[monthYear] || 0) + e.amount;
    });

    return Object.keys(monthlyMap)
      .sort() // Sort chronologically
      .map((key) => ({
        name: key,
        amount: Number(monthlyMap[key].toFixed(2)),
      }));
  };

  // Prepare data for Category Pie Chart
  const getCategoryData = () => {
    const categoryMap: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });

    return Object.keys(categoryMap)
      .sort((a, b) => categoryMap[b] - categoryMap[a]) // Sort descending by amount
      .map((key) => ({
        name: key,
        value: Number(categoryMap[key].toFixed(2)),
      }));
  };

  const monthlyData = getMonthlyData();
  const categoryData = getCategoryData();

  if (expenses.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Analisi Spese</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Bar Chart: Andamento Mensile */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
          <h3 className="text-lg font-bold text-gray-800 mb-6 w-full text-left">Andamento Mensile</h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `€${val}`} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} formatter={(val: any) => `€${Number(val).toFixed(2)}`} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Totale Spese" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Ripartizione Categorie */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
          <h3 className="text-lg font-bold text-gray-800 mb-6 w-full text-left">Ripartizione per Categoria</h3>
          <div className="w-full h-80 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  labelLine={false}
                >
                  {categoryData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => `€${Number(val).toFixed(2)}`} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
