import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { fetchRegistrations, fetchAdminEvents, patchRegistration, type AdminRegistration, type AdminEvent } from "@/lib/adminApi";

const STATUS_COLORS: Record<string, string> = {
  Confirmed: "bg-green-500/10 text-green-400 border-green-500/20",
  Waitlisted: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Pending: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function downloadCsv(registrations: AdminRegistration[], events: AdminEvent[], eventFilter: string) {
  const eventMap: Record<string, string> = {};
  events.forEach((e) => { eventMap[e.id] = e.name; });

  const rows = [
    ["Athlete Name", "Parent Email", "Phone", "Event", "Date Registered", "Status"],
    ...registrations.map((r) => [
      r.athleteName ?? "",
      r.email ?? "",
      r.phone ?? "",
      r.eventId ? (eventMap[r.eventId] ?? r.eventId) : "",
      formatDate(r.createdTime),
      r.status ?? "",
    ]),
  ];

  const csvContent = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const suffix = eventFilter && eventFilter !== "all" ? `-${(eventMap[eventFilter] ?? "event").toLowerCase().replace(/\s+/g, "-")}` : "";
  a.download = `registrations${suffix}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminRegistrationsTab() {
  const qc = useQueryClient();
  const [eventFilter, setEventFilter] = useState("all");

  const { data: events = [] } = useQuery({
    queryKey: ["admin-events"],
    queryFn: fetchAdminEvents,
  });

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["admin-registrations", eventFilter],
    queryFn: () => fetchRegistrations(eventFilter !== "all" ? { eventId: eventFilter } : undefined),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => patchRegistration(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-registrations"] }),
  });

  const eventMap: Record<string, string> = {};
  events.forEach((e) => { eventMap[e.id] = e.name; });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading registrations…
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-heading font-bold uppercase tracking-wide text-white text-lg">Registrations</h2>
          <p className="text-sm text-gray-400">{registrations.length} {eventFilter !== "all" ? "for this event" : "total"}</p>
        </div>
        <div className="flex gap-2">
          {events.length > 0 && (
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-52 bg-card border-border text-sm">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCsv(registrations, events, eventFilter)}
            disabled={registrations.length === 0}
            className="font-heading uppercase tracking-wide text-xs border-border"
          >
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No registrations found{eventFilter !== "all" ? " for this event" : ""}.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/40 text-gray-400 uppercase tracking-wide text-xs font-heading">
                  <th className="text-left px-4 py-3">Athlete</th>
                  <th className="text-left px-4 py-3">Parent Email</th>
                  <th className="text-left px-4 py-3">Phone</th>
                  <th className="text-left px-4 py-3">Event</th>
                  <th className="text-left px-4 py-3">Registered</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r, i) => (
                  <tr key={r.id} className={`border-b border-border/50 hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                    <td className="px-4 py-3 text-white font-medium">{r.athleteName}</td>
                    <td className="px-4 py-3 text-gray-300">{r.email}</td>
                    <td className="px-4 py-3 text-gray-400">{r.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-300 max-w-[160px] truncate">
                      {r.eventId ? (eventMap[r.eventId] ?? <span className="text-gray-500 text-xs">{r.eventId.slice(0, 8)}…</span>) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(r.createdTime)}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={r.status ?? "Pending"}
                        onValueChange={(status) => statusMutation.mutate({ id: r.id, status })}
                      >
                        <SelectTrigger className="h-7 w-36 text-xs bg-transparent border-border">
                          <SelectValue>
                            <Badge variant="outline" className={`text-xs ${STATUS_COLORS[r.status ?? "Pending"] ?? STATUS_COLORS.Pending}`}>
                              {r.status ?? "Pending"}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Confirmed">Confirmed</SelectItem>
                          <SelectItem value="Waitlisted">Waitlisted</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
