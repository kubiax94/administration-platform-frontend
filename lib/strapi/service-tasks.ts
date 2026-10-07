import type { entities, record, entity, identifier, text, fetchStrapi } from "../strapi/client";
import { entities, record, entity, identifier, text, fetchStrapi } from "../strapi/client";

export type UserRequestData = {
  id: string;
  requestNumber: string;
  status: string;
  serviceTask: string;
  location: string;
  createdAt: string;
};

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