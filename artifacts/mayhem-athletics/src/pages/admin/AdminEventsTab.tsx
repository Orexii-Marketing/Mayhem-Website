import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListEventTemplates, useCreateEvent } from "@workspace/api-client-react";
import type { EventInputType } from "@workspace/api-client-react";
import { fetchAdminEvents, patchEvent, deleteEvent, type AdminEvent } from "@/lib/adminApi";

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET ?? "";

const TYPE_COLORS: Record<string, string> = {
  Practice: "bg-primary/10 text-primary border-primary/20",
  Scrimmage: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Camp: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Clinic: "bg-green-500/10 text-green-400 border-green-500/20",
};

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface EditForm {
  name: string;
  type: string;
  date: string;
  time: string;
  location: string;
  capacity: string;
  scheduleTemplateId: string;
}

export default function AdminEventsTab() {
  const qc = useQueryClient();
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<EditForm>({ name: "", type: "Practice", date: "", time: "", location: "", capacity: "20", scheduleTemplateId: "" });
  const [createForm, setCreateForm] = useState<EditForm>({ name: "", type: "Practice", date: "", time: "", location: "", capacity: "20", scheduleTemplateId: "" });
  const [saving, setSaving] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: fetchAdminEvents,
  });

  const { data: templates = [] } = useListEventTemplates();

  const patchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminEvent> }) => patchEvent(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-events"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-events"] }),
  });

  const createEvent = useCreateEvent({
    request: { headers: { "Admin-Secret": ADMIN_SECRET } },
  });

  function openEdit(ev: AdminEvent) {
    setEditingEvent(ev);
    setForm({
      name: ev.name,
      type: ev.type || "Practice",
      date: ev.date,
      time: ev.time,
      location: ev.location,
      capacity: String(ev.capacity),
      scheduleTemplateId: ev.scheduleTemplateId ?? "",
    });
  }

  async function handleSaveEdit() {
    if (!editingEvent) return;
    setSaving(true);
    try {
      await patchMutation.mutateAsync({
        id: editingEvent.id,
        data: {
          name: form.name,
          type: form.type,
          date: form.date,
          time: form.time,
          location: form.location,
          capacity: Number(form.capacity),
          scheduleTemplateId: form.scheduleTemplateId && form.scheduleTemplateId !== "none" ? form.scheduleTemplateId : null,
        },
      });
      setEditingEvent(null);
    } finally {
      setSaving(false);
    }
  }

  function handleStatusToggle(ev: AdminEvent, published: boolean) {
    patchMutation.mutate({ id: ev.id, data: { status: published ? "Published" : "Draft" } });
  }

  function handleDelete() {
    if (!deletingId) return;
    deleteMutation.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    createEvent.mutate(
      {
        data: {
          name: createForm.name,
          type: createForm.type as EventInputType,
          date: createForm.date,
          time: createForm.time,
          location: createForm.location,
          capacity: Number(createForm.capacity),
          scheduleTemplateId: createForm.scheduleTemplateId && createForm.scheduleTemplateId !== "none" ? createForm.scheduleTemplateId : null,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["admin-events"] });
          setCreateSuccess(true);
          setCreateForm({ name: "", type: "Practice", date: "", time: "", location: "", capacity: "20", scheduleTemplateId: "" });
          setTimeout(() => { setCreateSuccess(false); setShowCreate(false); }, 1500);
        },
      },
    );
  }

  function EventForm({ f, setF, onSubmit, submitLabel, loading }: {
    f: EditForm;
    setF: (v: EditForm) => void;
    onSubmit?: (e: React.FormEvent) => void;
    submitLabel?: string;
    loading?: boolean;
  }) {
    return (
      <form onSubmit={onSubmit ?? ((e) => e.preventDefault())} className="flex flex-col gap-4 mt-4">
        <div className="grid gap-1.5">
          <Label>Event Name</Label>
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label>Type</Label>
            <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Practice", "Scrimmage", "Camp", "Clinic"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Capacity</Label>
            <Input type="number" min="1" value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label>Date</Label>
            <Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} required />
          </div>
          <div className="grid gap-1.5">
            <Label>Time</Label>
            <Input placeholder="5:00 PM" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label>Location</Label>
          <Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} required />
        </div>
        {templates.length > 0 && (
          <div className="grid gap-1.5">
            <Label>Training Plan Template</Label>
            <Select value={f.scheduleTemplateId || "none"} onValueChange={(v) => setF({ ...f, scheduleTemplateId: v })}>
              <SelectTrigger><SelectValue placeholder="No template" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No template</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}{t.sport ? ` (${t.sport})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {submitLabel && (
          <Button type="submit" disabled={loading} className="font-heading uppercase tracking-wide mt-2">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : submitLabel}
          </Button>
        )}
      </form>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading events…
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-heading font-bold uppercase tracking-wide text-white text-lg">Events</h2>
          <p className="text-sm text-gray-400">{events.length} total</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="font-heading uppercase tracking-wide text-xs">
          <Plus className="w-4 h-4 mr-1.5" /> New Event
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No events yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/40 text-gray-400 uppercase tracking-wide text-xs font-heading">
                  <th className="text-left px-4 py-3">Event</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Location</th>
                  <th className="text-center px-4 py-3">Signups</th>
                  <th className="text-center px-4 py-3">Published</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev, i) => (
                  <tr key={ev.id} className={`border-b border-border/50 hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                    <td className="px-4 py-3 text-white font-medium max-w-[200px] truncate">{ev.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${TYPE_COLORS[ev.type] ?? TYPE_COLORS.Practice}`}>
                        {ev.type || "Practice"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{formatDate(ev.date)}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-[180px] truncate">{ev.location}</td>
                    <td className="px-4 py-3 text-center text-gray-300">
                      {ev.registrantCount ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <Switch
                          checked={ev.status === "Published" || ev.status === "Active"}
                          onCheckedChange={(checked) => handleStatusToggle(ev, checked)}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-white" onClick={() => openEdit(ev)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-red-400" onClick={() => setDeletingId(ev.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Sheet */}
      <Sheet open={!!editingEvent} onOpenChange={(o) => { if (!o) setEditingEvent(null); }}>
        <SheetContent className="bg-card border-l border-border w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-heading uppercase tracking-wide text-white">Edit Event</SheetTitle>
            <SheetDescription className="text-gray-400">Changes save directly to Airtable.</SheetDescription>
          </SheetHeader>
          <EventForm f={form} setF={setForm} />
          <div className="flex gap-3 mt-6">
            <Button onClick={handleSaveEdit} disabled={saving} className="flex-1 font-heading uppercase tracking-wide text-xs">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => setEditingEvent(null)} className="flex-1">Cancel</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Sheet */}
      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent className="bg-card border-l border-border w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-heading uppercase tracking-wide text-white">New Event</SheetTitle>
            <SheetDescription className="text-gray-400">Creates the event in Airtable.</SheetDescription>
          </SheetHeader>
          {createSuccess ? (
            <div className="mt-6 text-center text-primary font-semibold">✓ Event created!</div>
          ) : (
            <EventForm
              f={createForm}
              setF={setCreateForm}
              onSubmit={handleCreateSubmit}
              submitLabel="Create Event"
              loading={createEvent.isPending}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirm */}
      <AlertDialog open={!!deletingId} onOpenChange={(o) => { if (!o) setDeletingId(null); }}>
        <AlertDialogContent className="bg-card border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete this event?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete the event from Airtable. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-border text-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
