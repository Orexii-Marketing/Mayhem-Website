import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useListEventTemplates } from "@workspace/api-client-react";
import {
  fetchTemplateDetail,
  patchTemplate,
  createTemplate,
  type TemplateDetail,
} from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  Plus,
  Trash2,
  Loader2,
  ClipboardList,
  Copy,
  CheckCircle2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DrillBlock {
  id: string;
  name: string;
  duration: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

function parseToDrillBlocks(items: string): DrillBlock[] {
  const trimmed = items.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      const arr = (Array.isArray(parsed) ? parsed : [parsed]) as Array<Record<string, unknown>>;
      return arr.map((item) => ({
        id: uid(),
        name: String(item.activity ?? item.Activity ?? item.name ?? item.Name ?? item.drill ?? ""),
        duration: Number(item.duration ?? item.Duration ?? 15),
      }));
    } catch {
      // fall through
    }
  }

  return trimmed
    .split("\n")
    .filter((l) => l.trim())
    .map((line) => {
      const clean = line.trim();
      const timeMatch = clean.match(/^\d+:\d+\s*[-:]\s*(.+)/);
      return {
        id: uid(),
        name: timeMatch ? timeMatch[1].trim() : clean,
        duration: 15,
      };
    });
}

function serializeBlocks(blocks: DrillBlock[]): string {
  let cumulative = 0;
  return JSON.stringify(
    blocks.map((b) => {
      const time = minutesToTime(cumulative);
      cumulative += b.duration;
      return { time, activity: b.name, duration: b.duration };
    }),
  );
}

// ─── SortableBlock ────────────────────────────────────────────────────────────

function SortableBlock({
  block,
  index,
  startTime,
  onChange,
  onDelete,
}: {
  block: DrillBlock;
  index: number;
  startTime: number;
  onChange: (id: string, field: keyof DrillBlock, value: string | number) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-background/60 border border-border rounded-lg px-3 py-2.5 group"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing shrink-0 touch-none"
        tabIndex={-1}
        type="button"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="w-12 text-xs text-primary font-mono font-semibold shrink-0 tabular-nums">
        {minutesToTime(startTime)}
      </div>

      <Input
        value={block.name}
        onChange={(e) => onChange(block.id, "name", e.target.value)}
        placeholder={`Drill ${index + 1}`}
        className="flex-1 h-8 text-sm bg-transparent border-border/60 focus:border-primary/50"
      />

      <div className="flex items-center gap-1.5 shrink-0">
        <Input
          type="number"
          min="1"
          max="180"
          value={block.duration}
          onChange={(e) => onChange(block.id, "duration", Math.max(1, Number(e.target.value)))}
          className="w-16 h-8 text-sm text-center bg-transparent border-border/60 focus:border-primary/50"
        />
        <span className="text-xs text-gray-500 w-7">min</span>
      </div>

      <button
        type="button"
        onClick={() => onDelete(block.id)}
        className="text-gray-600 hover:text-red-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── PlanBuilder ──────────────────────────────────────────────────────────────

function PlanBuilder({
  template,
  allTemplates,
  onSaved,
}: {
  template: TemplateDetail;
  allTemplates: Array<{ id: string; name: string; sport?: string | null }>;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const [blocks, setBlocks] = useState<DrillBlock[]>(() => parseToDrillBlocks(template.items));
  const [templateName, setTemplateName] = useState(template.name);
  const [sport, setSport] = useState(template.sport ?? "");
  const [saved, setSaved] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      patchTemplate(template.id, {
        name: templateName,
        sport: sport || undefined,
        items: serializeBlocks(blocks),
        durationMinutes: blocks.reduce((s, b) => s + b.duration, 0),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eventTemplates"] });
      setSaved(true);
      setTimeout(() => { setSaved(false); onSaved(); }, 1200);
    },
  });

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  function handleChange(id: string, field: keyof DrillBlock, value: string | number) {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  }

  function handleDelete(id: string) {
    setBlocks((bs) => bs.filter((b) => b.id !== id));
  }

  function addBlock() {
    setBlocks((bs) => [...bs, { id: uid(), name: "", duration: 15 }]);
  }

  function cloneFrom(sourceId: string) {
    const source = allTemplates.find((t) => t.id === sourceId);
    if (!source) return;
    // Fetch the detail and pre-load
    fetchTemplateDetail(sourceId).then((detail) => {
      setBlocks(parseToDrillBlocks(detail.items));
    });
  }

  let cumulative = 0;
  const startTimes = blocks.map((b) => {
    const t = cumulative;
    cumulative += b.duration;
    return t;
  });
  const totalMinutes = blocks.reduce((s, b) => s + b.duration, 0);

  return (
    <div className="flex flex-col gap-4 mt-4 pb-6">
      {/* Template meta */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label className="text-xs">Template Name</Label>
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="h-8 text-sm bg-background/60 border-border/70"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Sport</Label>
          <Select value={sport || "none"} onValueChange={(v) => setSport(v === "none" ? "" : v)}>
            <SelectTrigger className="h-8 text-sm bg-background/60 border-border/70">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Any / General</SelectItem>
              {["Soccer", "Football", "Basketball", "Baseball"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clone from */}
      {allTemplates.length > 1 && (
        <div className="flex items-center gap-2">
          <Copy className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <span className="text-xs text-gray-500">Clone drills from:</span>
          <Select onValueChange={cloneFrom}>
            <SelectTrigger className="h-7 text-xs flex-1 bg-background/40 border-border/50">
              <SelectValue placeholder="Choose template…" />
            </SelectTrigger>
            <SelectContent>
              {allTemplates.filter((t) => t.id !== template.id).map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Column headers */}
      <div className="flex items-center gap-2 px-1">
        <div className="w-4 shrink-0" />
        <div className="w-12 text-xs text-gray-500 uppercase tracking-wide font-heading shrink-0">Time</div>
        <div className="flex-1 text-xs text-gray-500 uppercase tracking-wide font-heading">Drill / Activity</div>
        <div className="w-24 text-xs text-gray-500 uppercase tracking-wide font-heading text-center">Duration</div>
        <div className="w-4 shrink-0" />
      </div>

      {/* Drill blocks */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {blocks.map((block, i) => (
              <SortableBlock
                key={block.id}
                block={block}
                index={i}
                startTime={startTimes[i]}
                onChange={handleChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {blocks.length === 0 && (
        <div className="text-center py-8 text-gray-600 text-sm border border-dashed border-border/50 rounded-lg">
          No drills yet. Click "+ Add Drill" to get started.
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={addBlock}
        className="border-dashed border-border/60 text-gray-400 hover:text-white hover:border-primary/40 font-heading uppercase tracking-wide text-xs"
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Drill
      </Button>

      {blocks.length > 0 && (
        <div className="text-xs text-gray-500 text-right">
          Total: <span className="text-gray-300">{minutesToTime(totalMinutes)}</span> ({totalMinutes} min)
        </div>
      )}

      <div className="border-t border-border/50 pt-4 mt-2">
        {saved ? (
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" /> Saved to Airtable!
          </div>
        ) : (
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || templateName.trim() === ""}
            className="w-full font-heading uppercase tracking-wide text-xs"
          >
            {saveMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
            ) : (
              "Save Training Plan"
            )}
          </Button>
        )}
        {saveMutation.isError && (
          <p className="text-xs text-red-400 mt-2">
            Save failed: {(saveMutation.error as Error).message}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function AdminTrainingPlansTab() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSport, setNewSport] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: templates = [], isLoading } = useListEventTemplates();

  const { data: selectedTemplate, isLoading: loadingDetail } = useQuery({
    queryKey: ["templateDetail", selectedId],
    queryFn: () => fetchTemplateDetail(selectedId!),
    enabled: !!selectedId,
  });

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const result = await createTemplate({ name: newName.trim(), sport: newSport || undefined });
      await qc.invalidateQueries({ queryKey: ["eventTemplates"] });
      setShowNewDialog(false);
      setNewName("");
      setNewSport("");
      if (result.id) setSelectedId(result.id);
    } finally {
      setCreating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading templates…
      </div>
    );
  }

  return (
    <div className="flex gap-6 min-h-[500px]">
      {/* Left: template list */}
      <div className="w-64 shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-heading font-bold uppercase tracking-wide text-white text-base">Plans</h2>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-primary hover:text-primary/80 hover:bg-primary/10 font-heading uppercase tracking-wide"
            onClick={() => setShowNewDialog(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> New
          </Button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-sm">
            No templates yet.
          </div>
        ) : (
          templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`text-left px-3 py-2.5 rounded-lg border transition-all ${
                selectedId === t.id
                  ? "bg-primary/10 border-primary/30 text-white"
                  : "bg-card border-border text-gray-300 hover:border-primary/20 hover:bg-white/[0.03]"
              }`}
            >
              <div className="font-medium text-sm">{t.name}</div>
              {t.sport && (
                <div className="text-xs text-gray-500 mt-0.5">{t.sport}</div>
              )}
            </button>
          ))
        )}
      </div>

      {/* Right: builder or empty state */}
      <div className="flex-1 min-w-0">
        {!selectedId ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center text-gray-600 border border-dashed border-border/40 rounded-xl">
            <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Select a training plan to edit</p>
            <p className="text-xs mt-1 text-gray-700">or create a new one</p>
          </div>
        ) : loadingDetail ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading plan…
          </div>
        ) : selectedTemplate ? (
          <div className="bg-card border border-border rounded-xl px-5 overflow-y-auto max-h-[70vh]">
            <div className="sticky top-0 bg-card pt-4 pb-2 border-b border-border/50 mb-2 z-10">
              <h3 className="font-heading font-bold uppercase tracking-wide text-white text-base">
                {selectedTemplate.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Drag to reorder · Changes saved to Airtable when you hit Save
              </p>
            </div>
            <PlanBuilder
              key={selectedTemplate.id}
              template={selectedTemplate}
              allTemplates={templates}
              onSaved={() => {
                qc.invalidateQueries({ queryKey: ["eventTemplates"] });
              }}
            />
          </div>
        ) : null}
      </div>

      {/* New template dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="bg-card border border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase tracking-wide text-white">
              New Training Plan
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Plan Name</Label>
              <Input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Tuesday Practice"
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Sport (optional)</Label>
              <Select value={newSport || "none"} onValueChange={(v) => setNewSport(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Any / General" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any / General</SelectItem>
                  {["Soccer", "Football", "Basketball", "Baseball"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="font-heading uppercase tracking-wide text-xs"
            >
              {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
