"use client";

import {
  ArrowLeft, ArrowRight, Bell, BookOpen, Building2, CalendarDays,
  CheckCircle2, ChevronRight, CircleHelp, ClipboardList, ExternalLink,
  Headphones, Home, Laptop, LogOut, MapPin, Menu, Package, Search,
  ShieldCheck, ShoppingCart, TicketCheck, Wrench, X, type LucideIcon,
} from "lucide-react";
import { useDeferredValue, useRef, useState } from "react";
import type { AuthenticatedUser, UserRequest } from "@/lib/auth";
import type { HomepageData, QuickLinkData, ServiceTaskData } from "@/lib/strapi";

type ServiceTask = ServiceTaskData & {
  icon: LucideIcon;
  tone: "coral" | "blue" | "green" | "amber" | "violet";
};

type QuickLink = QuickLinkData & { icon: LucideIcon };

const demoServiceTasks: ServiceTask[] = [
  {
    id: "access", slug: "dostepy-i-przepustki", name: "Dostępy i przepustki", description: "Przepustki, uprawnienia oraz dostęp do obiektów i systemów.", icon: ShieldCheck, tone: "coral",
    categories: [
      { id: "car-pass", name: "Przepustka samochodowa", description: "Nowa przepustka lub zmiana danych pojazdu", eta: "około 5 min" },
      { id: "building-access", name: "Dostęp do budynku", description: "Nadanie lub zmiana dostępu do stref", eta: "około 4 min" },
      { id: "pass-issue", name: "Problem z przepustką", description: "Zgłoszenie niedziałającej karty lub dostępu", eta: "około 3 min" },
    ],
  },
  {
    id: "orders", slug: "zakupy-i-zamowienia", name: "Zakupy i zamówienia", description: "Materiały biurowe, wyposażenie oraz zamówienia wewnętrzne.", icon: ShoppingCart, tone: "blue",
    categories: [
      { id: "office-supplies", name: "Materiały biurowe", description: "Standardowe materiały i drobne wyposażenie", eta: "około 4 min" },
      { id: "computer-equipment", name: "Sprzęt komputerowy", description: "Zamówienie komputera, monitora lub akcesoriów", eta: "około 7 min" },
      { id: "other-order", name: "Inne zamówienie", description: "Produkt spoza standardowego katalogu", eta: "około 6 min" },
    ],
  },
  {
    id: "technical", slug: "sprawy-techniczne", name: "Sprawy techniczne", description: "Awarie, infrastruktura, IT oraz utrzymanie stanowiska pracy.", icon: Wrench, tone: "amber",
    categories: [
      { id: "it-issue", name: "Problem IT", description: "Komputer, aplikacja, konto lub sieć", eta: "około 5 min" },
      { id: "technical-fault", name: "Usterka techniczna", description: "Awaria wyposażenia lub infrastruktury", eta: "około 4 min" },
      { id: "workstation", name: "Przygotowanie stanowiska", description: "Konfiguracja miejsca pracy dla pracownika", eta: "około 8 min" },
    ],
  },
  {
    id: "transport", slug: "transport-pracowniczy", name: "Transport pracowniczy", description: "Rozkłady, trasy i zgłoszenia dotyczące autobusów pracowniczych.", icon: Building2, tone: "green",
    categories: [
      { id: "stop-change", name: "Zmiana przystanku", description: "Dodanie lub zmiana przystanku na trasie", eta: "około 3 min" },
      { id: "transport-issue", name: "Problem z przejazdem", description: "Opóźnienie, brak kursu lub inny problem", eta: "około 4 min" },
      { id: "new-route", name: "Nowa trasa", description: "Wniosek o analizę nowej trasy", eta: "około 6 min" },
    ],
  },
  {
    id: "offboarding", slug: "ostatni-dzien-pracy", name: "Ostatni dzień pracy", description: "Zwrot sprzętu, zamknięcie dostępów i formalności końcowe.", icon: Package, tone: "violet",
    categories: [
      { id: "equipment-return", name: "Zwrot wyposażenia", description: "Komputer, telefon, karta i pozostały sprzęt", eta: "około 5 min" },
      { id: "access-close", name: "Zamknięcie dostępów", description: "Konta systemowe i dostępy do obiektów", eta: "około 4 min" },
    ],
  },
];

const demoQuickLinks: QuickLink[] = [
  { id: "knowledge", label: "Baza wiedzy", url: "#", icon: BookOpen },
  { id: "applications", label: "Katalog aplikacji", url: "#", icon: Laptop },
  { id: "support", label: "Kontakty i wsparcie", url: "#", icon: Headphones },
];

const demoLocations = [
  { id: "bce", name: "BCE", street: "al. Piłsudskiego 92", city: "41-308 Dąbrowa Górnicza" },
  { id: "ltt", name: "LTT", street: "ul. Tadeusza Sendzimira 1", city: "31-752 Kraków" },
  { id: "swietochlowice", name: "Świętochłowice", street: "ul. Metalowców 5", city: "41-600 Świętochłowice" },
  { id: "zdzieszowice", name: "Zdzieszowice", street: "ul. Powstańców Śląskich 1", city: "47-330 Zdzieszowice" },
];

const fallbackIcons = [ShieldCheck, ShoppingCart, Wrench, Building2, Package];
const tones: ServiceTask["tone"][] = ["coral", "blue", "amber", "green", "violet"];

export default function Dashboard({
  data,
  user,
  requests,
  onLogout,
}: {
  data: HomepageData;
  user: AuthenticatedUser;
  requests: UserRequest[];
  onLogout: () => void;
}) {
  const [view, setView] = useState<"home" | "requests">("home");
  const [query, setQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<ServiceTask | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const serviceSliderRef = useRef<HTMLDivElement>(null);
  const deferredQuery = useDeferredValue(query);
  const serviceTasks: ServiceTask[] = data.serviceTasks.length
    ? data.serviceTasks.map((task, index) => ({ ...task, icon: fallbackIcons[index % fallbackIcons.length], tone: tones[index % tones.length] }))
    : demoServiceTasks;
  const quickLinks: QuickLink[] = data.quickLinks.length
    ? data.quickLinks.map((link, index) => ({ ...link, icon: fallbackIcons[index % fallbackIcons.length] }))
    : demoQuickLinks;
  const importantLocations = data.locations.length ? data.locations : demoLocations;
  const visibleTasks = serviceTasks.filter((task) => `${task.name} ${task.description}`.toLocaleLowerCase("pl").includes(deferredQuery.toLocaleLowerCase("pl")));
  const myRequests = requests.map((request) => ({
    id: request.request_number,
    title: request.service_task.name ?? "Zgłoszenie",
    category: request.location?.name ?? "Brak lokalizacji",
    date: formatRequestDate(request.created_at),
    status: request.status,
  }));
  const displayName = user.name ?? user.email ?? "Użytkownik";
  const firstName = displayName.split(/\s+/)[0];
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("pl");
  const roleLabel = user.roles.includes("RequestAdmin")
    ? "Administrator"
    : user.roles.includes("RequestAgent") ? "Obsługa zgłoszeń" : "Pracownik";

  function chooseTask(task: ServiceTask) {
    setSelectedTask(task);
    setSelectedCategory(null);
  }

  function scrollServices(direction: -1 | 1) {
    serviceSliderRef.current?.scrollBy({ left: direction * 290, behavior: "smooth" });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Otwórz menu"><Menu size={20} /></button>
        <button className="brand" onClick={() => setView("home")} aria-label="Przejdź na stronę główną">
          <span className={`brand-mark ${data.logoUrl ? "has-logo" : ""}`} style={data.logoUrl ? { backgroundImage: `url(${data.logoUrl})` } : undefined}>{data.logoUrl ? "" : "AM"}</span>
          <span><strong>myServices</strong><small>ArcelorMittal Poland</small></span>
        </button>
        <nav className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Główna nawigacja">
          <button className={view === "home" ? "active" : ""} onClick={() => { setView("home"); setMenuOpen(false); }}><Home size={17} /> Strona główna</button>
          <button className={view === "requests" ? "active" : ""} onClick={() => { setView("requests"); setMenuOpen(false); }}><ClipboardList size={17} /> Moje zgłoszenia <span className="nav-count">{myRequests.length}</span></button>
        </nav>
        <div className="topbar-actions">
          <button className="icon-button notification" aria-label="Powiadomienia"><Bell size={19} /><span /></button>
          <button className="profile-button" onClick={onLogout} aria-label="Wyloguj użytkownika"><span className="avatar">{initials}</span><span className="profile-copy"><strong>{displayName}</strong><small>{roleLabel}</small></span><LogOut size={17} /></button>
        </div>
      </header>

      <main>
        {view === "home" ? (
          <>
            <section className="welcome-band">
              <div><span className="eyebrow">Portal pracowniczy</span><h1>Dzień dobry, {firstName}</h1><p>Załatw sprawę lub sprawdź status swojego zgłoszenia.</p></div>
              <div className="entra-badge"><ShieldCheck size={18} /><span><strong>Bezpieczna sesja</strong><small>Microsoft Entra ID</small></span></div>
            </section>

            <section className="service-section" aria-labelledby="service-heading">
              <div className="section-heading">
                <div><span className="step-label">Create a ticket</span><h2 id="service-heading">Wybierz usługę</h2><p>Przewiń listę i wybierz obszar zgłoszenia.</p></div>
                <label className="search-field"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Wyszukaj usługę..." aria-label="Wyszukaj usługę" />{query && <button onClick={() => setQuery("")} aria-label="Wyczyść wyszukiwanie"><X size={16} /></button>}</label>
              </div>
              <div className="slider-controls" aria-label="Sterowanie listą usług">
                <button onClick={() => scrollServices(-1)} aria-label="Poprzednie usługi"><ArrowLeft size={18} /></button>
                <button onClick={() => scrollServices(1)} aria-label="Następne usługi"><ArrowRight size={18} /></button>
              </div>
              <div className="service-slider" ref={serviceSliderRef}>
                {visibleTasks.map((task) => {
                  const Icon = task.icon;
                  return <button className={`service-card tone-${task.tone}`} key={task.id} onClick={() => chooseTask(task)}><span className={`service-icon ${task.iconUrl ? "has-media" : ""}`} style={task.iconUrl ? { backgroundImage: `url(${task.iconUrl})` } : undefined}>{!task.iconUrl && <Icon size={25} strokeWidth={1.8} />}</span><span className="service-copy"><strong>{task.name}</strong><small>{task.description}</small></span><span className="card-arrow"><ArrowRight size={18} /></span></button>;
                })}
              </div>
              {visibleTasks.length === 0 && <div className="empty-state"><Search size={24} /><strong>Nie znaleźliśmy takiej usługi</strong><span>Spróbuj wpisać inne hasło.</span></div>}
            </section>

            <section className="dashboard-grid">
              <div className="requests-panel">
                <div className="panel-heading"><div><span className="eyebrow">Ostatnia aktywność</span><h2>Moje zgłoszenia</h2></div><button className="text-button" onClick={() => setView("requests")}>Zobacz wszystkie <ArrowRight size={16} /></button></div>
                <RequestTable rows={myRequests.slice(0, 3)} />
              </div>
              <aside className="quick-panel">
                <span className="eyebrow">Na skróty</span><h2>Przydatne miejsca</h2>
                <div className="quick-links">{quickLinks.map(({ id, label, url, iconUrl, icon: Icon }) => <a key={id} href={url}><span className={`quick-link-icon ${iconUrl ? "has-media" : ""}`} style={iconUrl ? { backgroundImage: `url(${iconUrl})` } : undefined}>{!iconUrl && <Icon size={19} />}</span><span>{label}</span><ExternalLink size={15} /></a>)}</div>
                <div className="support-note"><CircleHelp size={20} /><div><strong>Potrzebujesz pomocy?</strong><span>Skontaktuj się z Service Desk</span></div></div>
              </aside>
            </section>

            <section className="locations-panel" aria-labelledby="locations-heading">
              <div className="locations-heading"><div><span className="eyebrow">Nasze zakłady</span><h2 id="locations-heading">Ważne lokalizacje</h2></div><MapPin size={24} /></div>
              <div className="locations-list">
                {importantLocations.map((location) => <article key={location.id}><span className="location-pin"><MapPin size={18} /></span><div><strong>{location.name}</strong><span>{location.street}</span><span>{location.city}</span></div></article>)}
              </div>
            </section>
          </>
        ) : (
          <section className="requests-view">
            <div className="page-title"><div><span className="eyebrow">Twoje sprawy</span><h1>Moje zgłoszenia</h1><p>Widzisz tylko zgłoszenia utworzone przez Ciebie.</p></div><button className="primary-button" onClick={() => setView("home")}><span>+</span> Nowe zgłoszenie</button></div>
            <div className="summary-row"><div><span>Wszystkie</span><strong>{myRequests.length}</strong></div><div><span>Aktywne</span><strong>2</strong></div><div><span>Rozwiązane</span><strong>1</strong></div></div>
            <div className="requests-panel full"><RequestTable rows={myRequests} /></div>
          </section>
        )}
      </main>

      {selectedTask && (
        <div className="modal-backdrop" onMouseDown={() => setSelectedTask(null)}>
          <section className="service-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="dialog-header">
              <span className="dialog-service-icon">{(() => { const Icon = selectedTask.icon; return <Icon size={24} />; })()}</span>
              <div><span className="step-label">Krok 2 z 3</span><h2 id="dialog-title">{selectedTask.name}</h2><p>Wybierz kategorię zgłoszenia.</p></div>
              <button className="icon-button" onClick={() => setSelectedTask(null)} aria-label="Zamknij"><X size={20} /></button>
            </div>
            <div className="category-list">
              {selectedTask.categories.map((category) => <button className={selectedCategory === category.name ? "selected" : ""} key={category.name} onClick={() => setSelectedCategory(category.name)}><span className="selection-dot">{selectedCategory === category.name && <CheckCircle2 size={20} />}</span><span><strong>{category.name}</strong><small>{category.description}</small></span><span className="eta"><CalendarDays size={14} /> {category.eta}</span><ChevronRight size={18} /></button>)}
            </div>
            <div className="dialog-footer"><span><MapPin size={16} /> Lokalizacja zostanie wybrana w następnym kroku</span><button className="primary-button" disabled={!selectedCategory}>Przejdź do formularza <ArrowRight size={17} /></button></div>
          </section>
        </div>
      )}
    </div>
  );
}

type RequestRow = { id: string; title: string; category: string; date: string; status: string };

function RequestTable({ rows }: { rows: RequestRow[] }) {
  return <div className="request-table"><div className="table-header"><span>Numer</span><span>Zgłoszenie</span><span>Data</span><span>Status</span><span /></div>{rows.map((request) => <button className="table-row" key={request.id}><span className="request-id"><TicketCheck size={17} />{request.id}</span><span><strong>{request.title}</strong><small>{request.category}</small></span><span>{request.date}</span><span><StatusBadge status={request.status} /></span><ChevronRight size={17} /></button>)}</div>;
}

function StatusBadge({ status }: { status: string }) {
  const statusClass = ["Rozwiązany", "Zamknięty"].includes(status) ? "resolved" : status === "Wstrzymany" ? "waiting" : "progress";
  return <span className={`status-badge ${statusClass}`}><span />{status}</span>;
}

function formatRequestDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", year: "numeric" }).format(date);
}