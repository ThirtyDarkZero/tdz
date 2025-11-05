import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface TrackFile {
  id: string;
  file: File;
  title: string;
  duration: number;
}

interface SortableTrackItemProps {
  track: TrackFile;
  index: number;
  editingTrackId: string | null;
  onEdit: (id: string) => void;
  onTitleChange: (id: string, title: string) => void;
  onRemove: (id: string) => void;
  onBlur: () => void;
  disabled?: boolean;
  formatDuration: (seconds: number) => string;
}

export const SortableTrackItem = ({
  track,
  index,
  editingTrackId,
  onEdit,
  onTitleChange,
  onRemove,
  onBlur,
  disabled,
  formatDuration
}: SortableTrackItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-3">
        <button
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          {...attributes}
          {...listeners}
          disabled={disabled}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        
        <span className="text-muted-foreground w-6 font-medium">{index + 1}</span>
        
        {editingTrackId === track.id ? (
          <Input
            value={track.title}
            onChange={(e) => onTitleChange(track.id, e.target.value)}
            onBlur={onBlur}
            onKeyDown={(e) => e.key === 'Enter' && onBlur()}
            autoFocus
            className="flex-1"
          />
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{track.title}</p>
              <p className="text-sm text-muted-foreground">{formatDuration(track.duration)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(track.id)}
              disabled={disabled}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(track.id)}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};