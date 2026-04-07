import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Dashboard from "./components/Dashboard";
import { ThemeProvider } from "./components/ThemeProvider";
import "./App.css";

function App() {
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null);
  const [dbUnlocked, setDbUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleUnlockDb = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!masterPassword) {
      setErrorMsg("La password del DB non può essere vuota");
      return;
    }
    try {
      await invoke("unlock_db", { password: masterPassword });
      setDbUnlocked(true);

      // Una volta sbloccato, controlliamo se esistono utenti
      const firstRun = await invoke<boolean>("check_first_run");
      setIsFirstRun(firstRun);
      if (firstRun) setIsRegistering(true);

    } catch (err: any) {
      setErrorMsg("Sblocco DB Fallito: Password errata o file corrotto.");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username || !password) {
      setErrorMsg("Username e Password sono obbligatori");
      return;
    }

    try {
      if (isRegistering) {
        // Registration
        await invoke("register", { username, password });
        setIsFirstRun(false);
        setIsAuthenticated(true);
      } else {
        // Login
        const success = await invoke<boolean>("login", { username, password });
        if (success) {
          setIsAuthenticated(true);
        } else {
          setErrorMsg("Credenziali errate");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.toString());
    }
  };

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
        {!dbUnlocked ? (
          <>
            <div className="text-center mb-8 flex flex-col items-center">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Database Protetto</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Inserisci la Master Password per decrittografare il file SQLite locale.
              </p>
            </div>

            <form onSubmit={handleUnlockDb} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Master Password (SQLCipher)
                </label>
                <input
                  type="password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                  placeholder="Password di crittografia..."
                />
              </div>

              {errorMsg && (
                <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gray-800 hover:bg-gray-900 dark:bg-primary dark:hover:bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg transition shadow-md"
              >
                Decrittografa Database
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-8 flex flex-col items-center">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {isRegistering ? "Crea Account Utente" : "Login Utente"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {isRegistering
                  ? "Registra il primo utente amministratore."
                  : "Bentornato. Accedi per visualizzare i tuoi dati."}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                  placeholder="Il tuo username..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                  placeholder="La tua password..."
                />
              </div>

              {errorMsg && (
                <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-primary hover:bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg transition shadow-md"
              >
                {isRegistering ? "Registrati" : "Accedi"}
              </button>

              {!isFirstRun && (
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setErrorMsg("");
                    }}
                    className="text-sm text-primary hover:underline"
                  >
                    {isRegistering ? "Hai già un account? Accedi" : "Vuoi aggiungere un utente? Registrati"}
                  </button>
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
