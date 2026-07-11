/**
 * React Query hooks for Conditions.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conditionsApi } from "@/services/api";
import { formKey } from "@/hooks/useForms";
import toast from "react-hot-toast";

export function useConditions(formId) {
  return useQuery({
    queryKey: ["conditions", formId],
    queryFn: () => conditionsApi.list(formId).then((r) => r.data),
    enabled: !!formId,
  });
}

export function useAddCondition(formId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => conditionsApi.create(formId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formKey(formId) });
      qc.invalidateQueries({ queryKey: ["conditions", formId] });
      toast.success("Condition added!");
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteCondition(formId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (condId) => conditionsApi.delete(formId, condId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formKey(formId) });
      qc.invalidateQueries({ queryKey: ["conditions", formId] });
      toast.success("Condition removed.");
    },
    onError: (err) => toast.error(err.message),
  });
}
