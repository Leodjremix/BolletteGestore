import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Dashboard from "./components/Dashboard";
import { ThemeProvider } from "./components/ThemeProvider";
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
        // Unlock database immediately after registering
        await invoke<boolean>("login", { password });
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
      <ThemeProvider>
        <Dashboard />
      </ThemeProvider>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
             {/* SVG Logo Placeholder */}
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isFirstRun ? "Benvenuto in Gestore Spese" : "Bentornato"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {isFirstRun
              ? "Crea un account offline per crittografare i tuoi dati in locale."
              : "Inserisci le tue credenziali per sbloccare il database."}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              disabled
              value="admin"
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 cursor-not-allowed outline-none"
              placeholder="Username"
              title="Per questa versione offline, l'utente è fisso."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Master Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
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
