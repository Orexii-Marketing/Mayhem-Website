const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET ?? "";

function headers(): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(ADMIN_SECRET ? { "Admin-Secret": ADMIN_SECRET } : {}),
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: { ...headers(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ── Events ───────────────────────────────────────────────────────────────────

export interface AdminEvent {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  status: string;
  registrantCount: number | null;
  scheduleTemplateId: string | null;
  ageGroup: string | null;
}

export function fetchAdminEvents(): Promise<AdminEvent[]> {
  return apiFetch("/events");
}

export function patchEvent(id: string, data: Partial<AdminEvent> & { time?: string }): Promise<{ success: boolean }> {
  return apiFetch(`/events/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteEvent(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/events/${id}`, { method: "DELETE" });
}

// ── Registrations ─────────────────────────────────────────────────────────────

export interface AdminRegistration {
  id: string;
  athleteName: string;
  email: string;
  phone: string | null;
  eventId: string | null;
  status: string;
  createdTime: string | null;
}

export function fetchRegistrations(params?: { email?: string; eventId?: string }): Promise<AdminRegistration[]> {
  const qs = new URLSearchParams();
  if (params?.email) qs.set("email", params.email);
  if (params?.eventId) qs.set("eventId", params.eventId);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/registrations${query}`);
}

export function patchRegistration(id: string, status: string): Promise<{ success: boolean }> {
  return apiFetch(`/registrations/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
}

// ── Templates ─────────────────────────────────────────────────────────────────

export interface TemplateDetail {
  id: string;
  name: string;
  sport: string | null;
  items: string;
  durationMinutes: number | null;
  description: string | null;
}

export function fetchTemplateDetail(id: string): Promise<TemplateDetail> {
  return apiFetch(`/event-templates/${id}`);
}

export function patchTemplate(id: string, data: Partial<TemplateDetail>): Promise<{ success: boolean }> {
  return apiFetch(`/event-templates/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function createTemplate(data: { name: string; sport?: string }): Promise<{ success: boolean; id: string | null }> {
  return apiFetch("/event-templates", { method: "POST", body: JSON.stringify(data) });
}
