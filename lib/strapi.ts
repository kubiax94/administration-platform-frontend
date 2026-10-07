export type ServiceCategoryData = {
  id: string;
  name: string;
  description: string;
  eta: string;
};

export type ServiceTaskData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconUrl?: string;
  categories: ServiceCategoryData[];
};

export type QuickLinkData = {
  id: string;
  label: string;
  url: string;
  iconUrl?: string;
};

export type LocationData = {
  id: string;
  name: string;
  street: string;
  city: string;
};

export type HomepageData = {
  logoUrl?: string;
  serviceTasks: ServiceTaskData[];
  quickLinks: QuickLinkData[];
  locations: LocationData[];
};

export type LoginPageData = {
    title: string;
    description: string;
    logoUrl?: string;
    backgroundUrl?: string;
}

export type UserRequestData = {
  id: string;
  requestNumber: string;
  status: string;
  serviceTask: string;
  location: string;
  createdAt: string;
};

type JsonRecord = Record<string, unknown>;

const strapiUrl = process.env.STRAPI_URL?.replace(/\/$/, "");

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function entity(value: unknown): JsonRecord {
  const source = record(value);
  return { ...source, ...record(source.attributes) };
}

function entities(value: unknown): JsonRecord[] {
  const source = record(value);
  const data = source.data ?? value;
  return Array.isArray(data) ? data.map(entity) : data ? [entity(data)] : [];
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function identifier(item: JsonRecord, fallback: string): string {
  return String(item.documentId ?? item.id ?? fallback);
}

function absoluteMediaUrl(value: unknown): string | undefined {
  const media = entities(value)[0] ?? entity(value);
  const url = text(media.url);
  if (!url) return undefined;
  if (/^https?:\/\//.test(url)) return url;
  return strapiUrl ? `${strapiUrl}${url.startsWith("/") ? "" : "/"}${url}` : undefined;
}

async function fetchStrapi(path: string): Promise<unknown> {
  if (!strapiUrl) return null;

  try {
    const response = await fetch(new URL(path, `${strapiUrl}/`), {
      headers: process.env.STRAPI_API_TOKEN
        ? { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` }
        : undefined,
      next: { revalidate: 60 },
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function mapServiceTasks(payload: unknown): ServiceTaskData[] {
  return entities(record(payload).data).map((item, index) => {
    const name = text(item.name, `Usługa ${index + 1}`);
    const slug = text(item.slug, name.toLocaleLowerCase("pl").replaceAll(" ", "-"));
    const categories = entities(item.categories).map((category, categoryIndex) => ({
      id: identifier(category, `${slug}-${categoryIndex}`),
      name: text(category.category_name ?? category.name, `Kategoria ${categoryIndex + 1}`),
      description: text(category.description),
      eta: text(category.eta, "około 5 min"),
    }));

    return {
      id: identifier(item, slug),
      name,
      slug,
      description: text(item.description),
      iconUrl: absoluteMediaUrl(item.icon),
      categories,
    };
  });
}

function mapQuickLinks(payload: unknown): QuickLinkData[] {
  return entities(record(payload).data).map((item, index) => ({
    id: identifier(item, `shortcut-${index}`),
    label: text(item.label ?? item.name ?? item.title, `Skrót ${index + 1}`),
    url: text(item.url ?? item.href, "#"),
    iconUrl: absoluteMediaUrl(item.icon),
  }));
}

function mapLocations(payload: unknown): LocationData[] {
  return entities(record(payload).data).map((item, index) => ({
    id: identifier(item, `location-${index}`),
    name: text(item.name, `Lokalizacja ${index + 1}`),
    street: text(item.street_name),
    city: [text(item.postal_code), text(item.city)].filter(Boolean).join(" "),
  }));
}

export async function getStrapiHomepageData(): Promise<HomepageData> {
  const [services, shortcuts, locations, homepage] = await Promise.all([
    fetchStrapi(process.env.STRAPI_SERVICE_TASKS_PATH ?? "/api/service-tasks?populate[icon]=true&populate[categories]=true&sort=name:asc"),
    fetchStrapi(process.env.STRAPI_SHORTCUTS_PATH ?? "/api/shortcuts?populate[icon]=true&sort=order:asc"),
    fetchStrapi(process.env.STRAPI_LOCATIONS_PATH ?? "/api/locations?filters[active][$eq]=true&sort=name:asc"),
    fetchStrapi(process.env.STRAPI_HOMEPAGE_PATH ?? "/api/homepage?populate[logo]=true"),
  ]);

  const homepageEntity = entity(record(homepage).data);
  return {
    logoUrl: absoluteMediaUrl(homepageEntity.logo),
    serviceTasks: mapServiceTasks(services),
    quickLinks: mapQuickLinks(shortcuts),
    locations: mapLocations(locations),
  };
}

export async function getStrapiRequestsForUser(subid: string): Promise<UserRequestData[]> {
  if (!subid) return [];

  const query = new URLSearchParams({
    "filters[requested_by][subid][$eq]": subid,
    "populate[service_task]": "true",
    "populate[main_location]": "true",
    "sort": "createdAt:desc",
  });
  const payload = await fetchStrapi(`/api/requests?${query}`);

  return entities(record(payload).data).map((item, index) => {
    const serviceTask = entities(item.service_task)[0] ?? entity(item.service_task);
    const location = entities(item.main_location)[0] ?? entity(item.main_location);
    return {
      id: identifier(item, `request-${index}`),
      requestNumber: text(item.id_request, `REQ-${index + 1}`),
      status: text(item.req_status, "Utworzony"),
      serviceTask: text(serviceTask.name),
      location: text(location.name),
      createdAt: text(item.createdAt),
    };
  });
}