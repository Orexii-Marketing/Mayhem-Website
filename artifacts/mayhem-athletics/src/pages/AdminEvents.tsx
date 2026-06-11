import { useState } from "react";
import { useCreateEvent } from "@workspace/api-client-react";
import type { EventInputType } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2, Lock } from "lucide-react";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "mayhem-admin";
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET ?? "";

export default function AdminEvents() {
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState<EventInputType>("Practice");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("20");
  const [notes, setNotes] = useState("");
  const [created, setCreated] = useState(false);

  const createEvent = useCreateEvent({
    request: { headers: { "Admin-Secret": ADMIN_SECRET } },
  });

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createEvent.mutate(
      {
        data: {
          name,
          type,
          date,
          time,
          location,
          capacity: Number(capacity),
          notes: notes || undefined,
        },
      },
      {
        onSuccess: () => {
          setCreated(true);
          setName("");
          setDate("");
          setTime("");
          setLocation("");
          setCapacity("20");
          setNotes("");
          setTimeout(() => setCreated(false), 4000);
        },
      },
    );
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-card border border-border rounded-xl p-8 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-primary" />
            <h1 className="font-heading font-bold uppercase tracking-wide text-xl text-white">
              Admin Access
            </h1>
          </div>
          <form onSubmit={handleUnlock} className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="pw">Password</Label>
              <Input
                id="pw"
                type="password"
                placeholder="Enter admin password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
              />
              {passwordError && (
                <p className="text-sm text-red-400">Incorrect password.</p>
              )}
            </div>
            <Button type="submit" className="font-heading uppercase tracking-wide">
              Unlock
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-xl">
        <h1 className="text-3xl md:text-4xl font-bold font-heading text-white uppercase tracking-tight mb-2">
          Create <span className="text-primary">Event</span>
        </h1>
        <div className="h-1 w-12 bg-primary mb-8" />

        {created && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 flex items-center gap-3 mb-6 text-primary">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold">
              Event created! It will appear on the events page.
            </span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-xl p-6 flex flex-col gap-5"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="name">Event Name</Label>
            <Input
              id="name"
              placeholder="e.g. Tuesday Practice"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as EventInputType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Practice">Practice</SelectItem>
                <SelectItem value="Scrimmage">Scrimmage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="text"
                placeholder="e.g. 5:00 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Venue or address"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="capacity">Spots Available</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              placeholder="20"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any details parents should know…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {createEvent.error && (
            <p className="text-sm text-red-400">
              Failed to create event. Please try again.
            </p>
          )}

          <Button
            type="submit"
            className="font-heading uppercase tracking-wide"
            disabled={createEvent.isPending}
          >
            {createEvent.isPending ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" /> Creating…
              </>
            ) : (
              "Create Event"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
