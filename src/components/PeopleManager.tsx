import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TrashIcon, PencilIcon } from "@heroicons/react/24/outline";

export interface Person {
  id: number;
  name: string;
  role: string | null;
}

export default function PeopleManager() {
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchPeople = async () => {
    try {
      const data = await invoke<Person[]>("get_people");
      setPeople(data);
    } catch (err: any) {
      setError(err.toString());
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const handleEditClick = (person: Person) => {
    setEditingId(person.id);
    setName(person.name);
    setRole(person.role || "");
  };

  const handleDeleteClick = async (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questa persona? Potrebbe essere associata a delle spese.")) {
      try {
        await invoke("delete_person", { id });
        fetchPeople();
      } catch (err: any) {
        alert("Errore durante l'eliminazione: " + err.toString());
      }
    }
  };

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const payload = { name, role: role || null };
      if (editingId) {
        await invoke("update_person", { id: editingId, ...payload });
      } else {
        await invoke("add_person", payload);
      }
      setEditingId(null);
      setName("");
      setRole("");
      fetchPeople();
    } catch (err: any) {
      setError(err.toString());
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Gestione Persone</h2>

      <form onSubmit={handleAddPerson} className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
        />
        <input
          type="text"
          placeholder="Ruolo (opzionale)"
          value={role}
          onChange={(e) => setRole(e.target.value)}
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
              setRole("");
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
              <th className="py-3 px-4 font-semibold text-gray-600">Ruolo</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr key={person.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-500">{person.id}</td>
                <td className="py-3 px-4 text-gray-800">{person.name}</td>
                <td className="py-3 px-4 text-gray-600">{person.role || "-"}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleEditClick(person)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteClick(person.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {people.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-500">
                  Nessuna persona trovata
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
