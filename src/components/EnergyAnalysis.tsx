import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export interface EnergyReading {
  id: number;
  date: string;
  temperature: number;
  humidity: number;
  electricity_kwh: number;
  gas_smc: number;
}

export default function EnergyAnalysis() {
  const [readings, setReadings] = useState<EnergyReading[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [electricityKwh, setElectricityKwh] = useState("");
  const [gasSmc, setGasSmc] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchReadings = async () => {
    try {
      const data = await invoke<EnergyReading[]>("get_energy_readings");
      setReadings(data);
    } catch (err: any) {
      setError(err.toString());
    }
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  const handleEditClick = (reading: EnergyReading) => {
    setEditingId(reading.id);
    setDate(reading.date);
    setTemperature(reading.temperature.toString());
    setHumidity(reading.humidity.toString());
    setElectricityKwh(reading.electricity_kwh.toString());
    setGasSmc(reading.gas_smc.toString());
  };

  const handleDeleteClick = async (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questa lettura?")) {
      try {
        await invoke("delete_energy_reading", { id });
        fetchReadings();
      } catch (err: any) {
        alert("Errore durante l'eliminazione: " + err.toString());
      }
    }
  };

  const handleAddReading = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        date,
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        electricityKwh: parseFloat(electricityKwh),
        gasSmc: parseFloat(gasSmc),
      };

      if (editingId) {
        await invoke("update_energy_reading", { id: editingId, ...payload });
      } else {
        await invoke("add_energy_reading", payload);
      }

      // Reset
      setEditingId(null);
      setTemperature("");
      setHumidity("");
      setElectricityKwh("");
      setGasSmc("");
      fetchReadings();
    } catch (err: any) {
      setError(err.toString());
    }
  };

  // Prediction Algorithm (Simple linear moving average based on recent inputs)
  const getPredictedData = () => {
    if (readings.length < 2) return readings;

    const data = [...readings];
    // Calculate average growth/decline rate of the last 3 readings (or fewer)
    const recent = readings.slice(-3);

    let eleRate = 0;
    let gasRate = 0;

    for (let i = 1; i < recent.length; i++) {
      eleRate += (recent[i].electricity_kwh - recent[i - 1].electricity_kwh);
      gasRate += (recent[i].gas_smc - recent[i - 1].gas_smc);
    }

    eleRate = eleRate / (recent.length - 1);
    gasRate = gasRate / (recent.length - 1);

    const last = recent[recent.length - 1];
    const nextDate = new Date(last.date);
    nextDate.setMonth(nextDate.getMonth() + 1);

    const prediction = {
      id: -1, // Dummy ID for chart
      date: nextDate.toISOString().split("T")[0] + " (Previsto)",
      temperature: last.temperature, // Assume similar weather for simple projection
      humidity: last.humidity,
      electricity_kwh: Math.max(0, last.electricity_kwh + eleRate),
      gas_smc: Math.max(0, last.gas_smc + gasRate),
    };

    return [...data, prediction];
  };

  const getYearOverYearData = () => {
    const monthlyMap: Record<string, { month: string, currentElec: number, currentGas: number, prevElec: number, prevGas: number }> = {};
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;

    readings.forEach((r) => {
      const d = new Date(r.date);
      const y = d.getFullYear();

      const monthLabel = d.toLocaleString('it-IT', { month: 'short' });

      if (!monthlyMap[monthLabel]) {
        monthlyMap[monthLabel] = { month: monthLabel, currentElec: 0, currentGas: 0, prevElec: 0, prevGas: 0 };
      }

      if (y === currentYear) {
        monthlyMap[monthLabel].currentElec += r.electricity_kwh;
        monthlyMap[monthLabel].currentGas += r.gas_smc;
      } else if (y === prevYear) {
        monthlyMap[monthLabel].prevElec += r.electricity_kwh;
        monthlyMap[monthLabel].prevGas += r.gas_smc;
      }
    });

    const sortedMonths = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
    return sortedMonths.map(m => monthlyMap[m]).filter(Boolean);
  };

  const chartData = getPredictedData();
  const yoyData = getYearOverYearData();

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Analisi Energetica & Predittiva</h2>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Form Column */}
        <div className="xl:col-span-1">
          <form onSubmit={handleAddReading} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">{editingId ? "Modifica Lettura" : "Nuova Lettura"}</h3>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setTemperature("");
                    setHumidity("");
                    setElectricityKwh("");
                    setGasSmc("");
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Annulla
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Temp. Media (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Umidità (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={humidity}
                    onChange={(e) => setHumidity(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Consumo Elettricità (kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  value={electricityKwh}
                  onChange={(e) => setElectricityKwh(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Consumo Gas (Smc)</label>
                <input
                  type="number"
                  step="0.01"
                  value={gasSmc}
                  onChange={(e) => setGasSmc(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}

              <button
                type="submit"
                className="w-full bg-primary hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition mt-4"
              >
                {editingId ? "Aggiorna Lettura" : "Salva Lettura"}
              </button>
            </div>
          </form>
        </div>

        {/* Chart & Table Column */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Andamento e Previsioni Consumi</h3>
          {readings.length === 0 ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">Aggiungi almeno una lettura per visualizzare il grafico.</p>
            </div>
          ) : (
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="electricity_kwh"
                    stroke="#3b82f6"
                    name="Elettricità (kWh)"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="gas_smc"
                    stroke="#f59e0b"
                    name="Gas (Smc)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>

              {readings.length > 1 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm">
                  <strong>Suggerimento di Ottimizzazione:</strong> In base ai trend recenti, il consumo previsto per il prossimo mese è calcolato.
                  Se noti picchi anomali legati a temperature esterne, valuta di ridurre la temperatura del termostato di 1°C per risparmiare circa il 6-8% sui costi di riscaldamento.
                </div>
              )}
            </div>
          )}
          </div>

          {/* YoY Chart Column */}
          {yoyData.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Comparazione Consumi Anno su Anno</h3>
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={yoyData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="currentElec" stroke="#3b82f6" name={`Luce (kWh) ${new Date().getFullYear()}`} strokeWidth={2} />
                    <Line yAxisId="left" type="monotone" strokeDasharray="5 5" dataKey="prevElec" stroke="#93c5fd" name={`Luce (kWh) ${new Date().getFullYear()-1}`} strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="currentGas" stroke="#f59e0b" name={`Gas (Smc) ${new Date().getFullYear()}`} strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" strokeDasharray="5 5" dataKey="prevGas" stroke="#fcd34d" name={`Gas (Smc) ${new Date().getFullYear()-1}`} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Table */}
          {readings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Storico Letture</h3>
              <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                      <th className="py-3 px-4 font-semibold text-gray-600">Data</th>
                      <th className="py-3 px-4 font-semibold text-gray-600">Temp / Umidità</th>
                      <th className="py-3 px-4 font-semibold text-gray-600">Luce (kWh)</th>
                      <th className="py-3 px-4 font-semibold text-gray-600">Gas (Smc)</th>
                      <th className="py-3 px-4 font-semibold text-gray-600 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map((r) => (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 text-sm">
                        <td className="py-3 px-4 text-gray-800">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-gray-600">{r.temperature}°C / {r.humidity}%</td>
                        <td className="py-3 px-4 font-medium text-blue-600">{r.electricity_kwh}</td>
                        <td className="py-3 px-4 font-medium text-orange-600">{r.gas_smc}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleEditClick(r)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteClick(r.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
