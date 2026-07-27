import { z } from "zod";

export function buildFieldSchema(field) {
  const config = field.config || {};
  let schema;

  switch (field.field_type) {
    case "text":
      schema = z.string();
      if (config.min_length != null) schema = schema.min(config.min_length, `Must be at least ${config.min_length} characters`);
      if (config.max_length != null) schema = schema.max(config.max_length, `Must be at most ${config.max_length} characters`);
      break;

    case "email":
      schema = z.string().email("Must be a valid email address");
      break;

    case "number":
      schema = z.coerce.number({ invalid_type_error: "Must be a valid number" });
      if (config.is_integer) schema = schema.int("Must be a whole number");
      if (config.min != null) schema = schema.min(config.min, `Must be at least ${config.min}`);
      if (config.max != null) schema = schema.max(config.max, `Must be at most ${config.max}`);
      break;

    case "date":
      schema = z.string().refine((val) => !isNaN(Date.parse(val)), "Must be a valid date");
      if (config.min_date) {
        schema = schema.refine(
          (val) => new Date(val) >= new Date(config.min_date),
          `Date must be on or after ${config.min_date}`
        );
      }
      if (config.max_date) {
        schema = schema.refine(
          (val) => new Date(val) <= new Date(config.max_date),
          `Date must be on or before ${config.max_date}`
        );
      }
      break;

    case "dropdown":
      schema = z.string();
      break;

    case "multi_checkbox":
      schema = z.string();
      break;

    case "rating":
      schema = z.coerce.number().min(1).max(config.scale || 5);
      break;

    case "file_upload":
      schema = z.string();
      break;

    default:
      schema = z.any();
  }

  return schema;
}

export function buildZodSchema(fields, fieldStates = {}) {
  const shape = {};
  fields.forEach((field) => {
    const state = fieldStates[field.id] || {};
    const isVisible = state.visible !== false;
    const isRequired = field.is_required || state.required === true;

    if (!isVisible) {
      // Hidden fields do not require validation
      shape[field.id] = z.any().optional();
      return;
    }

    let schema = buildFieldSchema(field);

    if (isRequired) {
      if (field.field_type === "number") {
        schema = z.coerce.number({
          required_error: "This field is required",
          invalid_type_error: "Must be a valid number",
        });
        const config = field.config || {};
        if (config.is_integer) schema = schema.int("Must be a whole number");
        if (config.min != null) schema = schema.min(config.min, `Must be at least ${config.min}`);
        if (config.max != null) schema = schema.max(config.max, `Must be at most ${config.max}`);
      } else {
        schema = schema.min(1, "This field is required");
      }
    } else {
      schema = schema.optional().or(z.literal(""));
    }

    shape[field.id] = schema;
  });

  return z.object(shape);
}
