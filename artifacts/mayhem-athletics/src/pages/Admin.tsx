import { useState, useEffect } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminEventsTab from "./admin/AdminEventsTab";
import AdminRegistrationsTab from "./admin/AdminRegistrationsTab";
import AdminTrainingPlansTab from "./admin/AdminTrainingPlansTab";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "mayhem-admin";
const SESSION_KEY = "mayhem_admin_unlocked";

export default function Admin() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (unlocked) sessionStorage.setItem(SESSION_KEY, "1");
  }, [unlocked]);

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPw("");
    }
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-card border border-border rounded-xl p-8 w-full max-w-sm shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading font-bold uppercase tracking-wide text-xl text-white">
                Admin Access
              </h1>
              <p className="text-xs text-gray-400">Mayhem Athletics</p>
            </div>
          </div>
          <form onSubmit={handleUnlock} className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="pw">Password</Label>
              <Input
                id="pw"
                type="password"
                placeholder="Enter admin password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoFocus
              />
              {error && <p className="text-sm text-red-400">Incorrect password.</p>}
            </div>
            <Button type="submit" className="font-heading uppercase tracking-wide">
              Unlock Dashboard
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold uppercase tracking-wide text-2xl text-white">
            Mayhem <span className="text-primary">Admin</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Coach Dashboard</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
          onClick={() => { sessionStorage.removeItem(SESSION_KEY); setUnlocked(false); }}
        >
          <Lock className="w-4 h-4 mr-1.5" /> Lock
        </Button>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs defaultValue="events">
          <TabsList className="mb-6 bg-card border border-border">
            <TabsTrigger value="events" className="font-heading uppercase tracking-wide text-xs">
              Events
            </TabsTrigger>
            <TabsTrigger value="registrations" className="font-heading uppercase tracking-wide text-xs">
              Registrations
            </TabsTrigger>
            <TabsTrigger value="plans" className="font-heading uppercase tracking-wide text-xs">
              Training Plans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <AdminEventsTab />
          </TabsContent>
          <TabsContent value="registrations">
            <AdminRegistrationsTab />
          </TabsContent>
          <TabsContent value="plans">
            <AdminTrainingPlansTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
