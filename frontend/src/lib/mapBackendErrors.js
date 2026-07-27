export function mapBackendErrors(error, setError) {
  // Try to find the detail block
  const detail = error?.response?.data?.detail || error?.data?.detail;
  if (!detail || typeof setError !== "function") return false;

  // Case 1: Array of detail validation items from FastAPI
  if (Array.isArray(detail)) {
    let mapped = false;
    detail.forEach((err) => {
      // Find field_id from ctx or field_id directly
      const fieldId = err.ctx?.field_id || err.field_id || (err.loc && err.loc[err.loc.length - 1]);
      if (fieldId && typeof fieldId === "string") {
        setError(fieldId, {
          type: "server",
          message: err.msg || "Invalid value",
        });
        mapped = true;
      }
    });
    return mapped;
  }

  // Case 2: Direct key-value dictionary of errors
  if (typeof detail === "object") {
    let mapped = false;
    Object.entries(detail).forEach(([key, msg]) => {
      setError(key, {
        type: "server",
        message: String(msg),
      });
      mapped = true;
    });
    return mapped;
  }

  return false;
}
