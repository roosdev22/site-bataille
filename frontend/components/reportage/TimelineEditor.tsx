// components/reportage/TimelineEditor.tsx

import { Bloc } from "@/types/reportage";
import { Trash2, GripVertical, Calendar, AlertCircle } from "lucide-react";

interface TimelineEditorProps {
  bloc: Bloc;
  errors?: Record<string, string>;  // ✅ Ajouter cette prop
  onUpdate: (field: string, value: any) => void;
}

export function TimelineEditor({ bloc, errors = {}, onUpdate }: TimelineEditorProps) {
  const timelineEvents = bloc.timeline_events || [];

  const addEvent = () => {
    const newEvents = [
      ...timelineEvents,
      {
        date_label: "",
        title: "",
        description: "",
        ordre: timelineEvents.length,
      },
    ];
    onUpdate("timeline_events", newEvents);
  };

  const removeEvent = (index: number) => {
    const newEvents = timelineEvents.filter((_, i) => i !== index);
    onUpdate("timeline_events", newEvents);
  };

  const updateEvent = (index: number, field: string, value: any) => {
    const newEvents = [...timelineEvents];
    (newEvents[index] as any)[field] = value;
    onUpdate("timeline_events", newEvents);
  };

  return (
    <div className="space-y-3">
      {/* Erreur générale de la timeline */}
      {errors.timeline && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          <AlertCircle size={14} />
          {errors.timeline}
        </div>
      )}

      {/* Liste des événements */}
      {timelineEvents.map((event: any, index: number) => (
        <div
          key={index}
          className={`border rounded-lg p-3 space-y-2 relative ${
            errors[`timeline_event_${index}`] ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
          }`}
        >
          {/* Ligne verticale timeline */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
          
          <div className="flex items-center justify-between pl-6">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-600">
                Événement {index + 1}
              </span>
            </div>
            <button
              onClick={() => removeEvent(index)}
              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Date */}
          <div className="pl-6">
            <input
              type="text"
              value={event.date_label || ""}
              onChange={(e) => updateEvent(index, "date_label", e.target.value)}
              className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:border-[#c9a84c] outline-none ${
                errors[`timeline_event_${index}`]?.includes('date')
                  ? 'border-red-300'
                  : 'border-gray-200'
              }`}
              placeholder="Date (ex: 12 janvier 2024)"
            />
          </div>

          {/* Titre */}
          <div className="pl-6">
            <input
              type="text"
              value={event.title || ""}
              onChange={(e) => updateEvent(index, "title", e.target.value)}
              className={`w-full px-3 py-1.5 rounded-lg border text-xs font-medium focus:border-[#c9a84c] outline-none ${
                errors[`timeline_event_${index}`]?.includes('title')
                  ? 'border-red-300'
                  : 'border-gray-200'
              }`}
              placeholder="Titre de l'événement"
            />
          </div>

          {/* Description */}
          <div className="pl-6">
            <textarea
              value={event.description || ""}
              onChange={(e) => updateEvent(index, "description", e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs min-h-[60px] resize-y focus:border-[#c9a84c] outline-none"
              placeholder="Description..."
            />
          </div>

          {/* Erreur spécifique */}
          {errors[`timeline_event_${index}`] && (
            <div className="pl-6">
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors[`timeline_event_${index}`]}
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Bouton ajouter */}
      <button
        onClick={addEvent}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
      >
        + Ajouter un événement
      </button>
    </div>
  );
}