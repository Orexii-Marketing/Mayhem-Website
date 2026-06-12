import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListEvents,
  useCreateEventRsvp,
  useGetEventSchedule,
  getListEventsQueryKey,
  getGetEventScheduleQueryKey,
} from "@workspace/api-client-react";
import type { Event as MayhemEvent } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, Clock, MapPin, Users, CheckCircle2, Loader2, ClipboardList } from "lucide-react";

// ─── Type badge / accent helpers ────────────────────────────────────────────

function getTypeBadgeClass(type: string): string {
  switch (type) {
    case "Scrimmage": return "bg-orange-500/20 text-orange-400";
    case "Camp":      return "bg-purple-500/20 text-purple-400";
    case "Clinic":    return "bg-green-500/20 text-green-400";
    default:          return "bg-primary/20 text-primary";
  }
}

function getTopBarClass(type: string): string {
  switch (type) {
    case "Scrimmage": return "bg-orange-500";
    case "Camp":      return "bg-purple-500";
    case "Clinic":    return "bg-green-500";
    default:          return "bg-primary";
  }
}

function todayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function parseScheduleLine(line: string): { time: string | null; activity: string } {
  const dashMatch = line.match(/^([0-9][^-]+?)\s+-\s+(.+)$/);
  if (dashMatch) return { time: dashMatch[1].trim(), activity: dashMatch[2].trim() };

  const colonIdx = line.indexOf(":");
  if (colonIdx > 0 && /^\d/.test(line)) {
    const before = line.slice(0, colonIdx).trim();
    const after = line.slice(colonIdx + 1).trim();
    if (after.length > 0) return { time: before, activity: after };
  }

  return { time: null, activity: line };
}

// ─── ScheduleModal ───────────────────────────────────────────────────────────

function ScheduleModal({
  eventId,
  eventName,
  open,
  onClose,
}: {
  eventId: string | null;
  eventName: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useGetEventSchedule(eventId ?? "", {
    query: { queryKey: getGetEventScheduleQueryKey(eventId ?? ""), enabled: !!eventId && open },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading uppercase tracking-wide text-xl">
            Training Plan
          </DialogTitle>
        </DialogHeader>

        <div className="bg-background rounded-lg px-4 py-3 mb-1 border border-border">
          <p className="text-primary font-bold font-heading uppercase text-sm tracking-wide">
            {eventName}
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <ClipboardList className="w-8 h-8 text-gray-600" />
            <p className="text-sm text-gray-400">
              No training plan has been set up for this event yet.
            </p>
          </div>
        )}

        {data && (
          <div className="flex flex-col gap-0">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">
              {data.templateName}
            </p>
            <div className="overflow-y-auto max-h-[50vh] pr-1">
              {data.lines.map((line, i) => {
                const { time, activity } = parseScheduleLine(line);
                return (
                  <div
                    key={i}
                    className="flex items-baseline gap-3 py-2.5 border-b border-border last:border-0"
                  >
                    {time && (
                      <span className="text-primary font-bold font-heading text-sm shrink-0 min-w-[60px]">
                        {time}
                      </span>
                    )}
                    <span className={`text-white text-sm${time ? "" : " font-medium"}`}>
                      {activity}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Button onClick={onClose} variant="outline" className="mt-2 font-heading uppercase">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ─── RsvpModal ────────────────────────────────────────────────────────────────

function RsvpModal({
  event,
  open,
  onClose,
}: {
  event: MayhemEvent | null;
  open: boolean;
  onClose: () => void;
}) {
  const [childName, setChildName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [success, setSuccess] = useState(false);
  const rsvp = useCreateEventRsvp();
  const queryClient = useQueryClient();

  function handleClose() {
    setChildName("");
    setEmail("");
    setPhone("");
    setSuccess(false);
    rsvp.reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;
    rsvp.mutate(
      { id: event.id, data: { childName, email, phone } },
      {
        onSuccess: () => {
          setSuccess(true);
          queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading uppercase tracking-wide text-xl">
            Sign Up
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="w-14 h-14 text-primary" />
            <p className="text-lg font-semibold text-white">{rsvp.data?.message}</p>
            <Button onClick={handleClose} className="mt-2 font-heading uppercase">Done</Button>
          </div>
        ) : (
          <>
            {event && (
              <div className="bg-background rounded-lg px-4 py-3 mb-2 border border-border">
                <p className="text-primary font-bold font-heading uppercase text-sm tracking-wide">
                  {event.name}
                </p>
                <p className="text-gray-400 text-sm mt-0.5">
                  {formatDate(event.date)} &bull; {event.time} &bull; {event.location}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="childName">Kid's Name</Label>
                <Input
                  id="childName"
                  placeholder="Athlete's first & last name"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  required
                  minLength={2}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="parent@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  minLength={7}
                />
              </div>

              {rsvp.error && (
                <p className="text-sm text-red-400">
                  Something went wrong. Please try again.
                </p>
              )}

              <Button
                type="submit"
                className="font-heading uppercase tracking-wide mt-2"
                disabled={rsvp.isPending}
              >
                {rsvp.isPending ? (
                  <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Submitting…</>
                ) : (
                  "Confirm Sign Up"
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── EventCard ────────────────────────────────────────────────────────────────

function EventCard({
  event,
  onSignUp,
  onViewSchedule,
}: {
  event: MayhemEvent;
  onSignUp: (event: MayhemEvent) => void;
  onViewSchedule: (event: MayhemEvent) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col hover:border-primary/40 transition-colors">
      <div className={`h-1.5 w-full ${getTopBarClass(event.type)}`} />
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading font-bold uppercase tracking-tight text-white text-lg leading-tight">
            {event.name}
          </h3>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge
              className={`text-xs font-bold uppercase tracking-wider border-0 ${getTypeBadgeClass(event.type)}`}
            >
              {event.type}
            </Badge>
            {event.ageGroup && (
              <Badge className="text-xs font-semibold border-0 bg-white/10 text-gray-300">
                {event.ageGroup}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 shrink-0 text-gray-500" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0 text-gray-500" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 shrink-0 text-gray-500" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 shrink-0 text-gray-500" />
            {event.registrantCount != null && event.registrantCount > 0 ? (
              <span className="text-orange-400 font-semibold">
                🔥 {event.registrantCount} athlete{event.registrantCount !== 1 ? "s" : ""} signed up
              </span>
            ) : (
              <span>Be the first to sign up!</span>
            )}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => onViewSchedule(event)}
            className="font-heading uppercase tracking-wide w-full border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
          >
            <ClipboardList className="mr-2 w-4 h-4" />
            Training Plan
          </Button>
          <Button
            onClick={() => onSignUp(event)}
            className="font-heading uppercase tracking-wide w-full"
          >
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Events page ─────────────────────────────────────────────────────────────

export default function Events() {
  const [filter, setFilter] = useState<string>("All");
  const [showPast, setShowPast] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MayhemEvent | null>(null);
  const [scheduleEvent, setScheduleEvent] = useState<MayhemEvent | null>(null);
  const { data: events, isLoading, isError } = useListEvents();

  const today = todayStr();

  const pastCount = (events ?? []).filter((e) => e.date < today).length;
  const visibleEvents = (events ?? []).filter((e) => showPast || e.date >= today);

  const allTypes = Array.from(new Set(visibleEvents.map((e) => e.type))).sort();

  const filtered = visibleEvents.filter((e) => filter === "All" || e.type === filter);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-10">
          <h1 className="text-4xl md:text-6xl font-bold font-heading text-white uppercase tracking-tight mb-2">
            Upcoming <span className="text-primary">Events</span>
          </h1>
          <div className="h-1 w-16 bg-primary mb-6" />
          <p className="text-gray-400 text-lg max-w-xl">
            Sign your athlete up for an upcoming practice, scrimmage, camp, or clinic. Click "Sign Up" on any session to register.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {["All", ...allTypes].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wider border transition-colors ${
                  filter === t
                    ? "bg-primary text-background border-primary"
                    : "bg-transparent text-gray-400 border-border hover:border-primary/40 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {!isLoading && !isError && pastCount > 0 && (
            <button
              onClick={() => setShowPast((v) => !v)}
              className="text-sm text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors whitespace-nowrap"
            >
              {showPast ? "Hide past events" : `Show past events (${pastCount})`}
            </button>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        )}

        {isError && (
          <div className="text-center py-24 text-gray-500">
            <p className="text-lg">Could not load events. Please try again later.</p>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-24 text-gray-500">
            <CalendarDays className="w-14 h-14 mx-auto mb-4 text-gray-700" />
            <p className="text-lg font-heading uppercase tracking-wide">
              No {filter !== "All" ? filter : ""} events scheduled yet
            </p>
            <p className="text-sm mt-2">Check back soon — new sessions are added regularly.</p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onSignUp={setSelectedEvent}
                onViewSchedule={setScheduleEvent}
              />
            ))}
          </div>
        )}
      </div>

      <RsvpModal
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      <ScheduleModal
        eventId={scheduleEvent?.id ?? null}
        eventName={scheduleEvent?.name ?? ""}
        open={!!scheduleEvent}
        onClose={() => setScheduleEvent(null)}
      />
    </div>
  );
}
