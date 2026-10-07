# myServices frontend

Portal pracowniczy Next.js z danymi zarządzanymi w Strapi.

## Microsoft Entra SSO

Frontend używa Authorization Code Flow z PKCE przez MSAL. Potrzebne są dwie App Registrations:

1. Backend API: w `Expose an API` dodaj scope `access_as_user` i role `Employee`, `RequestAgent`, `RequestAdmin`.
2. Frontend SPA: dodaj platformę `Single-page application` z redirect URI `http://localhost:3000` oraz delegated permission do scope backendu.

Utwórz `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_AZURE_TENANT_ID=<Directory tenant ID>
NEXT_PUBLIC_AZURE_CLIENT_ID=<Application client ID frontendu SPA>
NEXT_PUBLIC_AZURE_API_SCOPE=api://<Application client ID backendu>/access_as_user
```

Wartości `NEXT_PUBLIC_*` są publiczną konfiguracją OAuth, nie sekretami. Frontend nie może zawierać client secret. Po logowaniu access token jest pobierany przez MSAL i wysyłany do FastAPI pod `/api/v1/*`. Reverse proxy kieruje `/api/` do FastAPI, a pozostały ruch do Next.js.

## Strapi

Utwórz lokalny plik `.env.local`:

```env
STRAPI_URL=https://cms.example.com
STRAPI_API_TOKEN=read-only-content-api-token
```

Token jest używany wyłącznie po stronie serwera Next.js. Nie dodawaj prefiksu `NEXT_PUBLIC_`.

Domyślne endpointy:

```text
/api/service-tasks?populate[icon]=true&populate[categories]=true
/api/locations?filters[active][$eq]=true
/api/shortcuts?populate[icon]=true
/api/homepage?populate[logo]=true
```

Ścieżki można nadpisać przez `STRAPI_SERVICE_TASKS_PATH`, `STRAPI_LOCATIONS_PATH`, `STRAPI_SHORTCUTS_PATH` i `STRAPI_HOMEPAGE_PATH`. Jeśli CMS jest niedostępny, dashboard korzysta z danych demonstracyjnych.

Zgłoszenia muszą być pobierane przez `getStrapiRequestsForUser(subid)`. Funkcja zawsze filtruje relację `requested_by.subid`; wartość `subid` powinna pochodzić z serwerowej sesji Azure SSO.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
