import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkFirstRun() {
      try {
        const firstRun = await invoke<boolean>("check_first_run");
        setIsFirstRun(firstRun);
      } catch (err) {
        console.error("Failed to check first run:", err);
      }
    }
    checkFirstRun();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!password) {
      setErrorMsg("La password non può essere vuota");
      return;
    }

    try {
      if (isFirstRun) {
        // Registration
        await invoke("register", { password });
        setIsFirstRun(false);
        setIsAuthenticated(true); // Auto login after registration
      } else {
        // Login
        const success = await invoke<boolean>("login", { password });
        if (success) {
          setIsAuthenticated(true);
        } else {
          setErrorMsg("Password errata");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.toString());
    }
  };

  if (isFirstRun === null) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">Caricamento...</div>;
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">Benvenuto!</h1>
          <p className="text-gray-600">Database sbloccato con successo.</p>
          {/* Dashboard placeholder per i prossimi step */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {isFirstRun ? "Benvenuto nell'App" : "Bentornato"}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {isFirstRun
              ? "Crea una master password per crittografare i tuoi dati in locale."
              : "Inserisci la tua master password per sbloccare il database."}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Master Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
              placeholder="Inserisci la password..."
            />
          </div>

          {errorMsg && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-primary hover:bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg transition shadow-md"
          >
            {isFirstRun ? "Imposta Password e Inizia" : "Sblocca"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
