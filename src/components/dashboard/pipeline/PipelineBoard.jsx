import { useMemo, useRef, useState } from 'react';
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay, closestCorners } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { STAGES, getStage } from './stages';
import StageColumn from './StageColumn';
import StageTabs from './StageTabs';
import LeadCard from './LeadCard';

export default function PipelineBoard({ leads, onMove, onAddLead }) {
  const [mobileStage, setMobileStage] = useState('inquiry');
  const [activeLead, setActiveLead] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const leadsByStage = useMemo(() => {
    const map = Object.fromEntries(STAGES.map((s) => [s.id, []]));
    for (const lead of leads) {
      if (map[lead.status]) map[lead.status].push(lead);
    }
    return map;
  }, [leads]);

  const counts = useMemo(
    () => Object.fromEntries(STAGES.map((s) => [s.id, leadsByStage[s.id].length])),
    [leadsByStage],
  );

  const handleDragStart = (event) => {
    const leadId = event.active.data.current?.leadId;
    const found = leads.find((l) => l.id === leadId);
    if (found) setActiveLead(found);
  };

  const handleDragEnd = (event) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;
    const leadId = active.data.current?.leadId;
    const fromStage = active.data.current?.fromStage;
    const toStage = over.data.current?.stageId;
    if (!leadId || !toStage || fromStage === toStage) return;
    onMove(leadId, toStage);
  };

  const visibleStage = getStage(mobileStage) ?? STAGES[0];
  const mobileLeads = leadsByStage[visibleStage.id];

  // Swipe support
  const touchStartX = useRef(null);
  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    const idx = STAGES.findIndex((s) => s.id === mobileStage);
    if (delta < 0 && idx < STAGES.length - 1) setMobileStage(STAGES[idx + 1].id); // swipe left → next
    if (delta > 0 && idx > 0) setMobileStage(STAGES[idx - 1].id); // swipe right → prev
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveLead(null)}
    >
      {/* Mobile: tabs + vertical list */}
      <div className="md:hidden">
        <StageTabs active={visibleStage.id} counts={counts} onChange={setMobileStage} />

        <div
          className="mt-4 space-y-3"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {mobileLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onMove={onMove} draggable={false} />
          ))}

          {mobileLeads.length === 0 && visibleStage.id !== 'inquiry' && (
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl py-10 text-center text-sm text-slate-400 dark:text-slate-500">
              No leads in {visibleStage.title.toLowerCase()} yet
            </div>
          )}

          {visibleStage.id === 'inquiry' && (
            <button
              type="button"
              onClick={onAddLead}
              className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-medium hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 dark:hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors flex justify-center items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Lead
            </button>
          )}
        </div>
      </div>

      {/* Desktop: Kanban columns */}
      <div className="hidden md:block overflow-x-auto">
        <div className="flex gap-4 pb-4 min-w-fit">
          {STAGES.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              leads={leadsByStage[stage.id]}
              onMove={onMove}
              onAddLead={stage.id === 'inquiry' ? onAddLead : undefined}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeLead ? (
          <div className="rotate-2 scale-[1.02] shadow-xl">
            <LeadCard lead={activeLead} onMove={() => {}} draggable={false} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
