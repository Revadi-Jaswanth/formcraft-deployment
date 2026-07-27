import re
from typing import Any, Optional, List
from datetime import datetime

class FieldError:
    def __init__(self, message: str, field_id: str = "", field_label: str = ""):
        self.message = message
        self.field_id = field_id
        self.field_label = field_label

class ValidationEngine:
    def validate_file(
        self,
        filename: str,
        file_size_bytes: int,
        config: dict,
        field_label: str = "",
        field_id: str = ""
    ) -> Optional[FieldError]:
        allowed_types = config.get("allowed_types", [])
        max_size_mb = config.get("max_size_mb", 10)

        # Check file extension
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if allowed_types and ext not in allowed_types:
            return FieldError(
                message=f"File extension '.{ext}' is not allowed. Allowed types: {', '.join(allowed_types)}.",
                field_id=str(field_id),
                field_label=field_label
            )

        # Check file size
        max_bytes = max_size_mb * 1024 * 1024
        if file_size_bytes > max_bytes:
            return FieldError(
                message=f"File size ({file_size_bytes / (1024*1024):.2f} MB) exceeds the maximum limit of {max_size_mb} MB.",
                field_id=str(field_id),
                field_label=field_label
            )

        return None

    def validate_field(
        self,
        field: Any,
        value: Any,
        is_required: bool = False
    ) -> Optional[str]:
        config = field.config or {}
        val_str = "" if value is None else str(value).strip()

        # Required check
        if is_required and (val_str == "" or val_str == "[]"):
            return "This field is required."

        # If not required and empty, skip further validations
        if not is_required and (val_str == "" or val_str == "[]"):
            return None

        # Field type specific validations
        if field.field_type == "text":
            min_len = config.get("min_length")
            max_len = config.get("max_length")
            if min_len is not None and len(val_str) < int(min_len):
                return f"Must be at least {min_len} characters."
            if max_len is not None and len(val_str) > int(max_len):
                return f"Must be at most {max_len} characters."

        elif field.field_type == "email":
            email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
            if not re.match(email_regex, val_str):
                return "Must be a valid email address."

        elif field.field_type == "number":
            try:
                num = float(val_str)
                # Check integer
                if config.get("integer_only"):
                    if not num.is_integer():
                        return "Must be a whole number."
                    num = int(num)

                min_val = config.get("min_value")
                max_val = config.get("max_value")
                if min_val is not None and num < float(min_val):
                    return f"Must be at least {min_val}."
                if max_val is not None and num > float(max_val):
                    return f"Must be at most {max_val}."
            except ValueError:
                return "Must be a valid number."

        elif field.field_type == "date":
            try:
                include_time = config.get("include_time", False)
                dt_format = "%Y-%m-%dT%H:%M" if include_time else "%Y-%m-%d"
                # Strip seconds/milliseconds if present
                clean_val = val_str.split(".")[0]
                if len(clean_val) > 16:
                    clean_val = clean_val[:16]
                
                try:
                    dt = datetime.strptime(clean_val, dt_format)
                except ValueError:
                    # Fallback standard parsing
                    dt = datetime.fromisoformat(val_str)

                min_date = config.get("min_date")
                max_date = config.get("max_date")

                if min_date:
                    min_dt = datetime.fromisoformat(min_date)
                    if dt < min_dt:
                        return f"Date must be on or after {min_date}."
                if max_date:
                    max_dt = datetime.fromisoformat(max_date)
                    if dt > max_dt:
                        return f"Date must be on or before {max_date}."
            except Exception:
                return "Must be a valid date."

        elif field.field_type == "dropdown":
            # Ensure value is one of the option values
            opt_values = [opt.value for opt in field.options] if field.options else []
            if val_str not in opt_values:
                return "Selected option is invalid."

        elif field.field_type == "multi_checkbox":
            # Values are typically comma-separated or JSON list
            selected = val_str.split(",") if "," in val_str else [val_str]
            if val_str.startswith("[") and val_str.endswith("]"):
                import json
                try:
                    selected = json.loads(val_str)
                except Exception:
                    pass
            
            opt_values = [opt.value for opt in field.options] if field.options else []
            for item in selected:
                if item and item not in opt_values:
                    return f"Selected option '{item}' is invalid."

        elif field.field_type == "rating":
            try:
                num = int(val_str)
                scale = int(config.get("scale", 5))
                if num < 1 or num > scale:
                    return f"Rating must be between 1 and {scale}."
            except ValueError:
                return "Must be a valid rating."

        return None
