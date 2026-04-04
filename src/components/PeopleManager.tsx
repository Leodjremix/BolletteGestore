import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

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

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await invoke("add_person", { name, role: role || null });
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
          Aggiungi
        </button>
      </form>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-3 px-4 font-semibold text-gray-600">ID</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Nome</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Ruolo</th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr key={person.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-500">{person.id}</td>
                <td className="py-3 px-4 text-gray-800">{person.name}</td>
                <td className="py-3 px-4 text-gray-600">{person.role || "-"}</td>
              </tr>
            ))}
            {people.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-gray-500">
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
