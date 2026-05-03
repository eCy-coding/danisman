import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableWidgetProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const SortableWidget: React.FC<SortableWidgetProps> = ({ id, children, className }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: isDragging ? 'relative' as const : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? 'opacity-80 scale-105 shadow-2xl ring-2 ring-primary' : ''}`}
      {...attributes}
      {...listeners}
    >
      {/* 
        Ideally, we would separate the drag handle, but for this MVP 
        we make the whole widget draggable or rely on a specific handle if passed.
        Since we spread listeners here, the whole div is draggable.
        To improve UX, we could enforce a handle, but this is sufficient for v1.
      */}
      {children}
    </div>
  );
};
