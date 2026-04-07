import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TrashIcon, PencilIcon } from "@heroicons/react/24/outline";

export interface House {
  id: number;
  name: string;
  city: string | null;
  address: string | null;
}

export default function HousesManager() {
  const [houses, setHouses] = useState<House[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchHouses = async () => {
    try {
      const data = await invoke<House[]>("get_houses");
      setHouses(data);
    } catch (err: any) {
      setError(err.toString());
    }
  };

  useEffect(() => {
    fetchHouses();
  }, []);

  const handleEditClick = (house: House) => {
    setEditingId(house.id);
    setName(house.name);
    setAddress(house.address || "");
  };

  const handleDeleteClick = async (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questa abitazione? Potrebbe essere associata a delle spese.")) {
      try {
        await invoke("delete_house", { id });
        fetchHouses();
      } catch (err: any) {
        alert("Errore durante l'eliminazione: " + err.toString());
      }
    }
  };

  const handleAddHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const payload = { name, address: address || null };
      if (editingId) {
        await invoke("update_house", { id: editingId, ...payload });
      } else {
        await invoke("add_house", payload);
      }
      setEditingId(null);
      setName("");
      setAddress("");
      fetchHouses();
    } catch (err: any) {
      setError(err.toString());
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Gestione Abitazioni</h2>

      <form onSubmit={handleAddHouse} className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Nome Abitazione"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
        />
        <input
          type="text"
          placeholder="Indirizzo (opzionale)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
        />
        <button
          type="submit"
          className="bg-primary hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          {editingId ? "Aggiorna" : "Aggiungi"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setName("");
              setAddress("");
            }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-lg transition"
          >
            Annulla
          </button>
        )}
      </form>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-3 px-4 font-semibold text-gray-600">ID</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Nome</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Indirizzo</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {houses.map((house) => (
              <tr key={house.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-500">{house.id}</td>
                <td className="py-3 px-4 text-gray-800">{house.name}</td>
                <td className="py-3 px-4 text-gray-600">{house.address || "-"}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleEditClick(house)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteClick(house.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {houses.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-500">
                  Nessuna abitazione trovata
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
