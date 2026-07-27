/**
 * React Query hooks for Forms.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formsApi } from "@/services/api";
import toast from "react-hot-toast";

export const FORMS_KEY = "forms";
export const formKey = (id) => [FORMS_KEY, id];

const invalidateDashboardQueries = (qc) => {
  qc.invalidateQueries({ queryKey: [FORMS_KEY] });
  qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
  qc.invalidateQueries({ queryKey: ["dashboard-activity"] });
};

export function useForms(params = {}) {
  return useQuery({
    queryKey: [FORMS_KEY, params],
    queryFn: () => formsApi.list(params).then((r) => r.data),
  });
}

export function useForm(id) {
  return useQuery({
    queryKey: formKey(id),
    queryFn: () => formsApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => formsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      invalidateDashboardQueries(qc);
      toast.success("Form created successfully!");
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUpdateForm(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => formsApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formKey(id) });
      qc.invalidateQueries({ queryKey: [FORMS_KEY] });
      toast.success("Form updated!");
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => formsApi.delete(id),
    onSuccess: () => {
      invalidateDashboardQueries(qc);
      toast.success("Form deleted.");
    },
    onError: (err) => toast.error(err.message),
  });
}

export function usePublishForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => formsApi.publish(id, data).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: formKey(id) });
      invalidateDashboardQueries(qc);
      toast.success("🚀 Form published!");
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useArchiveForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => formsApi.archive(id).then((r) => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: formKey(id) });
      invalidateDashboardQueries(qc);
      toast.success("Form archived.");
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useRestoreForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => formsApi.restore(id).then((r) => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: formKey(id) });
      invalidateDashboardQueries(qc);
      toast.success("Form restored to draft.");
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDuplicateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => formsApi.duplicate(id, data).then((r) => r.data),
    onSuccess: () => {
      invalidateDashboardQueries(qc);
      toast.success("Form duplicated!");
    },
    onError: (err) => toast.error(err.message),
  });
}
