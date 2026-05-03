import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy 
} from '@dnd-kit/sortable';
import { useDashboardStore, Widget } from '../../store/useDashboardStore';
import { SortableWidget } from './SortableWidget';
import { AIExecutiveSummary } from './widgets/AIExecutiveSummary';
import { LiveTeamActivity } from './widgets/LiveTeamActivity';
import { realtimeService } from '../../services/realtimeService';

// Example Placeholder Widgets for Demo
const PlaceholderWidget = ({ title, color }: { title: string, color: string }) => (
    <div className={`h-full p-6 rounded-2xl bg-white/5 border border-white/10 shadow-sm flex flex-col ${color}`}>
        <h3 className="font-bold text-white mb-2">{title}</h3>
        <div className="grow flex items-center justify-center text-slate-600 text-4xl font-bold opacity-20">
            CHART
        </div>
    </div>
);

export const DashboardGrid: React.FC = () => {
  const { widgets, setWidgets } = useDashboardStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    realtimeService.connect();
    
    // Self-Healing: If 'activity' widget is missing (old state), reset layout
    if (!widgets.find(w => w.id === 'activity')) {

        useDashboardStore.getState().resetLayout();
    }

    return () => realtimeService.disconnect();
  }, [widgets]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), // Prevent accidental drags
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (activeId) setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);
      setWidgets(arrayMove(widgets, oldIndex, newIndex));
    }
  };

  const renderWidgetContent = (widget: Widget) => {
    switch(widget.type) {
        case 'ai-summary': return <AIExecutiveSummary />;
        case 'activity': return <LiveTeamActivity />;
        case 'revenue': return <PlaceholderWidget title={widget.title} color="" />;
        case 'traffic': return <PlaceholderWidget title={widget.title} color="" />;
        case 'users': return <PlaceholderWidget title={widget.title} color="" />;
        default: return <div>Unknown Widget</div>;
    }
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragEnd={handleDragEnd}
      onDragStart={(event) => setActiveId(event.active.id as string)}
    >
      <SortableContext items={widgets} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[250px]">
          {widgets.filter(w => w.visible).map((widget) => {
             // Span logic for specific widgets
             const isLarge = widget.type === 'ai-summary' || widget.type === 'revenue';
             const spanClass = isLarge ? 'md:col-span-2' : 'col-span-1';

             return (
              <SortableWidget key={widget.id} id={widget.id} className={spanClass}>
                {renderWidgetContent(widget)}
              </SortableWidget>
             );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
};
