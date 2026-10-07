import {
  BrowserCacheLocation,
  InteractionRequiredAuthError,
  type AccountInfo,
  type Configuration,
  type IPublicClientApplication,
  type RedirectRequest,
} from "@azure/msal-browser";

const tenantId = process.env.NEXT_PUBLIC_AZURE_TENANT_ID ?? "";
const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID ?? "";
const apiScope = process.env.NEXT_PUBLIC_AZURE_API_SCOPE ?? "";
const browserOrigin = typeof window === "undefined" ? undefined : window.location.origin;
const appUrl = browserOrigin ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const apiBaseUrl = "";
export const isAuthConfigured = Boolean(tenantId && clientId && apiScope);

export type AuthenticatedUser = {
  subject: string;
  email: string | null;
  name: string | null;
  roles: string[];
  scopes: string[];
  client_id: string;
};

export type UserRequest = {
  document_id: string;
  request_number: string;
  status: string;
  service_task: { document_id: string | null; name: string | null };
  location: { document_id: string | null; name: string | null } | null;
  created_at: string | null;
};

export type UserRequestList = {
  items: UserRequest[];
  page: number;
  page_size: number;
  total: number;
};

export const msalConfig: Configuration = {
  auth: {
    clientId: clientId || "missing-client-id",
    authority: `https://login.microsoftonline.com/${tenantId || "common"}`,
    redirectUri: appUrl,
    postLogoutRedirectUri: appUrl,
  },
  cache: {
    cacheLocation: BrowserCacheLocation.SessionStorage,
  },
  system: {
    allowPlatformBroker: false,
    nativeBrokerHandshakeTimeout: 1000,
  },
};

export const tokenRequest: RedirectRequest = {
  scopes: apiScope ? [apiScope] : [],
};

export async function acquireApiToken(
  instance: IPublicClientApplication,
  account: AccountInfo,
): Promise<string> {
  try {
    const result = await instance.acquireTokenSilent({
      account,
      scopes: tokenRequest.scopes,
    });
    return result.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await instance.acquireTokenRedirect({ ...tokenRequest, account });
    }
    throw error;
  }
}