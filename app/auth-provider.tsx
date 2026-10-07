"use client";

import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { useEffect, useState, type ReactNode } from "react";

import { msalConfig } from "@/lib/auth";

const msalInstance = new PublicClientApplication(msalConfig);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.race([
      msalInstance.initialize(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Inicjalizacja MSAL przekroczyła 8 sekund")), 8000)),
    ])
      .then(() => { if (active) setReady(true); })
      .catch((initializationError: unknown) => {
        if (active) setError(initializationError instanceof Error ? initializationError.message : "Nie udało się uruchomić Microsoft Entra ID");
      });
    return () => { active = false; };
  }, []);

  if (error) {
    return <main className="auth-bootstrap"><strong>Błąd konfiguracji logowania</strong><span>{error}</span></main>;
  }

  if (!ready) {
    return <main className="auth-bootstrap"><span className="auth-loader" aria-label="Inicjalizacja logowania" /></main>;
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}