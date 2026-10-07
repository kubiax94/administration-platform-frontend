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
};

export type UserRequestData = {
  id: string;
  requestNumber: string;
  status: string;
  serviceTask: string;
  location: string;
  createdAt: string;
};
