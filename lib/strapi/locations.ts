import type { LocationData } from "../strapi";
import { entities, record, identifier, text } from "../strapi/client";
import JSON5 from "json5";

export function mapLocations(payload: unknown): LocationData[] {
  return entities(record(payload).data).map((item, index) => ({
    id: identifier(item, `location-${index}`),
    name: text(item.name, `Lokalizacja ${index + 1}`),
    street: text(item.street_name),
    city: [text(item.postal_code), text(item.city)].filter(Boolean).join(" "),
  }));
}