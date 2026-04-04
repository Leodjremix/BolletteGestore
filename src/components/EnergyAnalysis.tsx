import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
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

  const handleAddReading = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await invoke("add_energy_reading", {
        date,
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        electricityKwh: parseFloat(electricityKwh),
        gasSmc: parseFloat(gasSmc),
      });

      // Reset
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

  const chartData = getPredictedData();

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Analisi Energetica & Predittiva</h2>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Form Column */}
        <div className="xl:col-span-1">
          <form onSubmit={handleAddReading} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Nuova Lettura</h3>

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
                Salva Lettura
              </button>
            </div>
          </form>
        </div>

        {/* Chart Column */}
        <div className="xl:col-span-2 flex flex-col">
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
      </div>
    </div>
  );
}
