import AuthenticatedApp from "./authenticated-app";
import { getStrapiHomepageData } from "@/lib/strapi";

export default async function Home() {
  const data = await getStrapiHomepageData();
  return <AuthenticatedApp data={data} />;
}