/**
 * Form Builder — Center panel: drag-and-drop field list using dnd-kit.
 */
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Settings, Star, Hash, Type, AlignLeft, Mail, Phone, ChevronDown, CheckSquare, Calendar, Upload } from "lucide-react";
import { useDeleteField, useReorderFields } from "@/hooks/useFields";
import { getFieldIcon, getFieldColor, getFieldLabel } from "@/lib/fieldTypes";

export default function FieldList({ formId, fields, selectedField, onSelectField }) {
  const deleteMutation = useDeleteField(formId);
  const reorderMutation = useReorderFields(formId);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(fields, oldIndex, newIndex);
    reorderMutation.mutate(reordered.map((f) => f.id));
  };

  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center">
          <Type className="w-8 h-8 text-slate-600" />
        </div>
        <div>
          <p className="font-medium text-slate-300">No fields yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Click a field type on the left to add your first field.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {fields.length} Field{fields.length !== 1 ? "s" : ""}
        </p>
        <p className="text-xs text-slate-600">Drag to reorder</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {fields.map((field, index) => (
            <SortableFieldRow
              key={field.id}
              field={field}
              index={index}
              isSelected={selectedField?.id === field.id}
              onSelect={() => onSelectField(field)}
              onDelete={() => {
                if (confirm(`Delete "${field.label}"?`)) {
                  deleteMutation.mutate(field.id);
                  if (selectedField?.id === field.id) onSelectField(null);
                }
              }}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableFieldRow({ field, index, isSelected, onSelect, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = getFieldIcon(field.field_type);
  const color = getFieldColor(field.field_type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group flex items-center gap-3 p-4 rounded-xl border cursor-pointer
                  transition-all duration-150 ${
        isSelected
          ? "border-brand-500 bg-brand-600/10"
          : "border-surface-700 bg-surface-900 hover:border-brand-600/40 hover:bg-surface-800"
      }`}
    >
      {/* Drag handle */}
      <button
        className="drag-handle shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Field icon */}
      <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center shrink-0">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>

      {/* Field info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-200 truncate">{field.label}</p>
          {field.is_required && (
            <span className="text-red-400 text-xs font-medium shrink-0">Required</span>
          )}
        </div>
        <p className="text-xs text-slate-500">{getFieldLabel(field.field_type)}</p>
      </div>

      {/* Order index */}
      <span className="text-xs text-slate-600 font-mono shrink-0">{index + 1}</span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="btn-icon btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
        <button
          className="btn-icon btn-sm hover:text-red-400"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
