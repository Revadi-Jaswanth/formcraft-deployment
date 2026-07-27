/**
 * Field type metadata — icons, labels, default configs.
 */
import {
  Type,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  ChevronDown,
  CheckSquare,
  Calendar,
  Upload,
  Star,
} from "lucide-react";

export const FIELD_TYPES = [
  {
    type: "text",
    label: "Short Text",
    icon: Type,
    description: "Single-line text input",
    color: "text-blue-400",
    defaultConfig: { min_length: 0, max_length: 500, multiline: false },
  },
  {
    type: "textarea",
    label: "Long Text",
    icon: AlignLeft,
    description: "Multi-line textarea",
    color: "text-indigo-400",
    defaultConfig: { min_length: 0, max_length: 5000, rows: 4 },
  },
  {
    type: "number",
    label: "Number",
    icon: Hash,
    description: "Numeric input with constraints",
    color: "text-violet-400",
    defaultConfig: { min_value: null, max_value: null, integer_only: false, decimal_places: 2 },
  },
  {
    type: "email",
    label: "Email",
    icon: Mail,
    description: "Email address with validation",
    color: "text-pink-400",
    defaultConfig: {},
  },
  {
    type: "phone",
    label: "Phone",
    icon: Phone,
    description: "Phone number input",
    color: "text-rose-400",
    defaultConfig: { format_validation: true },
  },
  {
    type: "dropdown",
    label: "Dropdown",
    icon: ChevronDown,
    description: "Single-select from options",
    color: "text-amber-400",
    defaultConfig: { allow_other: false, searchable: false, multiple: false },
  },
  {
    type: "radio",
    label: "Radio Buttons",
    icon: CheckSquare,
    description: "Single-select radio list",
    color: "text-purple-400",
    defaultConfig: { allow_other: false },
  },
  {
    type: "multi_checkbox",
    label: "Checkboxes",
    icon: CheckSquare,
    description: "Multi-select checkboxes",
    color: "text-emerald-400",
    defaultConfig: { min_selections: 0, max_selections: null },
  },
  {
    type: "date",
    label: "Date",
    icon: Calendar,
    description: "Date / date-time picker",
    color: "text-cyan-400",
    defaultConfig: { include_time: false },
  },
  {
    type: "file_upload",
    label: "File Upload",
    icon: Upload,
    description: "Secure file upload",
    color: "text-teal-400",
    defaultConfig: { max_size_mb: 10, multiple: false, max_files: 1 },
  },
  {
    type: "rating",
    label: "Rating",
    icon: Star,
    description: "Star / heart rating scale",
    color: "text-yellow-400",
    defaultConfig: { scale: 5, icon: "star", low_label: "Poor", high_label: "Excellent" },
  },
];

export const FIELD_TYPE_MAP = Object.fromEntries(FIELD_TYPES.map((f) => [f.type, f]));

export function getFieldIcon(type) {
  return FIELD_TYPE_MAP[type]?.icon ?? Type;
}

export function getFieldLabel(type) {
  return FIELD_TYPE_MAP[type]?.label ?? type;
}

export function getFieldColor(type) {
  return FIELD_TYPE_MAP[type]?.color ?? "text-slate-400";
}

export const CONDITION_OPERATORS = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "greater_than", label: "is greater than" },
  { value: "less_than", label: "is less than" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
  { value: "in", label: "is one of" },
];

export const CONDITION_ACTIONS = [
  { value: "show", label: "Show" },
  { value: "hide", label: "Hide" },
  { value: "require", label: "Make required" },
  { value: "disable", label: "Disable" },
];
