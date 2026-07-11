/**
 * React Query hooks for Fields.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fieldsApi } from "@/services/api";
import { formKey } from "@/hooks/useForms";
import toast from "react-hot-toast";

export function useFields(formId) {
  return useQuery({
    queryKey: ["fields", formId],
    queryFn: () => fieldsApi.list(formId).then((r) => r.data),
    enabled: !!formId,
  });
}

export function useAddField(formId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => fieldsApi.create(formId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formKey(formId) });
      toast.success("Field added!");
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUpdateField(formId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fieldId, data }) =>
      fieldsApi.update(formId, fieldId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formKey(formId) });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteField(formId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fieldId) => fieldsApi.delete(formId, fieldId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formKey(formId) });
      toast.success("Field removed.");
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useReorderFields(formId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fieldIds) => fieldsApi.reorder(formId, fieldIds).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formKey(formId) });
    },
    onError: (err) => toast.error(err.message),
  });
}
