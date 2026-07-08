import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

/**
 * A sortable row that exposes a dedicated drag handle (keyboard-accessible via
 * dnd-kit's KeyboardSensor). Children render the row body.
 */
export function SortableRow({
  id,
  children,
  handleClassName = '',
}: {
  id: string;
  children: (handle: ReactNode) => ReactNode;
  handleClassName?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  const handle = (
    <button
      ref={undefined}
      className={`focusable cursor-grab touch-none rounded p-1 text-ink-soft/60 hover:bg-black/5 active:cursor-grabbing dark:hover:bg-white/10 ${handleClassName}`}
      aria-label="Drag to reorder"
      {...attributes}
      {...listeners}
    >
      <GripVertical size={16} />
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {children(handle)}
    </div>
  );
}
