"use client";

import { InteractionStatus } from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { LogIn, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import Dashboard from "./dashboard";
import type { HomepageData } from "@/lib/strapi";
import { acquireApiToken, apiBaseUrl, isAuthConfigured, tokenRequest, type AuthenticatedUser, type UserRequest } from "@/lib/auth";

export default function AuthenticatedApp({ data }: { data: HomepageData }) {
  const { instance, accounts, inProgress } = useMsal();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const account = accounts[0];

  useEffect(() => {
    if (!isAuthConfigured || !account || inProgress !== InteractionStatus.None) return;

    let cancelled = false;
    instance.setActiveAccount(account);

    async function loadUser() {
      try {
        const accessToken = await acquireApiToken(instance, account);
        const headers = { Authorization: `Bearer ${accessToken}` };
        const [profileResponse, requestsResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/v1/auth/me`, { headers }),
          fetch(`${apiBaseUrl}/api/v1/requests/mine?page_size=20`, { headers }),
        ]);
        if (!profileResponse.ok) {
          const payload = await profileResponse.json().catch(() => null);
          throw new Error(payload?.detail ?? `Backend odrzucił token (${profileResponse.status})`);
        }
        if (!requestsResponse.ok) {
          const payload = await requestsResponse.json().catch(() => null);
          throw new Error(payload?.detail ?? `Nie udało się pobrać zgłoszeń (${requestsResponse.status})`);
        }
        const profile = await profileResponse.json() as AuthenticatedUser;
        const requestList = await requestsResponse.json() as { items: UserRequest[] };
        if (!cancelled) {
          setUser(profile);
          setRequests(requestList.items);
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Nie udało się potwierdzić sesji");
      }
    }

    void loadUser();
    return () => { cancelled = true; };
  }, [account, inProgress, instance]);

  if (!isAuthConfigured) {
    return <AuthScreen title="Brak konfiguracji Entra" description="Uzupełnij zmienne NEXT_PUBLIC_AZURE_* w pliku .env.local." />;
  }

  if (inProgress !== InteractionStatus.None) {
    return <AuthScreen title="Trwa uwierzytelnianie" description="Łączymy się bezpiecznie z Microsoft Entra ID." loading />;
  }

  if (!account) {
    return (
      <AuthScreen title="Portal pracowniczy" description="Zaloguj się kontem firmowym, aby przejść do swoich usług i zgłoszeń.">
        <button className="auth-primary" onClick={() => void instance.loginRedirect(tokenRequest)}><LogIn size={18} /> Zaloguj z Microsoft</button>
      </AuthScreen>
    );
  }

  if (error) {
    return (
      <AuthScreen title="Nie udało się potwierdzić dostępu" description={error}>
        <button className="auth-primary" onClick={() => void instance.logoutRedirect({ account })}>Wyloguj</button>
      </AuthScreen>
    );
  }

  if (!user) {
    return <AuthScreen title="Sprawdzamy uprawnienia" description="Backend weryfikuje token i przypisane role." loading />;
  }

  return <Dashboard data={data} user={user} requests={requests} onLogout={() => void instance.logoutRedirect({ account })} />;
}

function AuthScreen({
  title,
  description,
  loading = false,
  children,
}: {
  title: string;
  description: string;
  loading?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <span className="auth-logo">AM</span>
        <div className="auth-icon"><ShieldCheck size={25} /></div>
        <h1>{title}</h1>
        <p>{description}</p>
        {loading && <span className="auth-loader" aria-label="Ładowanie" />}
        {children}
        <small>Microsoft Entra ID</small>
      </section>
    </main>
  );
}