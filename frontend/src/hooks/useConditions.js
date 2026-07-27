/**
 * React Query hooks for Conditional Rules (Conditions).
 *
 * Milestone 1 hooks (useConditions, useAddCondition, useDeleteCondition) preserved.
 * Milestone 2 additions: useRules (alias), useCreateRule, useDeleteRule, useUpdateRule.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conditionsApi } from "@/services/api";
import { formKey } from "@/hooks/useForms";
import toast from "react-hot-toast";

// ── Cache key factory ─────────────────────────────────────────────────────────
export const rulesKey = (formId) => ["conditions", formId];

// ── READ ──────────────────────────────────────────────────────────────────────

/** Fetch all conditional rules for a form. */
export function useConditions(formId) {
  return useQuery({
    queryKey: rulesKey(formId),
    queryFn: () => conditionsApi.list(formId).then((r) => r.data),
    enabled: !!formId,
  });
}

/** Alias used by Module 2 components. */
export const useRules = useConditions;

// ── CREATE ────────────────────────────────────────────────────────────────────

/** Add a new conditional rule; invalidates form + rules cache. */
export function useAddCondition(formId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => conditionsApi.create(formId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formKey(formId) });
      qc.invalidateQueries({ queryKey: rulesKey(formId) });
      toast.success("Rule added!");
    },
    onError: (err) => toast.error(err.message ?? "Failed to add rule."),
  });
}

/** Alias used by Module 2 components. */
export const useCreateRule = useAddCondition;

// ── UPDATE ────────────────────────────────────────────────────────────────────

/** Update an existing conditional rule. */
export function useUpdateRule(formId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, data }) =>
      conditionsApi.update(formId, ruleId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formKey(formId) });
      qc.invalidateQueries({ queryKey: rulesKey(formId) });
      toast.success("Rule updated!");
    },
    onError: (err) => toast.error(err.message ?? "Failed to update rule."),
  });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

/** Delete a conditional rule by ID with optimistic removal. */
export function useDeleteCondition(formId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (condId) => conditionsApi.delete(formId, condId),
    onMutate: async (condId) => {
      await qc.cancelQueries({ queryKey: rulesKey(formId) });
      const prev = qc.getQueryData(rulesKey(formId));
      qc.setQueryData(rulesKey(formId), (old) =>
        Array.isArray(old) ? old.filter((r) => r.id !== condId) : old
      );
      return { prev };
    },
    onError: (err, _, ctx) => {
      if (ctx?.prev) qc.setQueryData(rulesKey(formId), ctx.prev);
      toast.error(err.message ?? "Failed to delete rule.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: formKey(formId) });
      qc.invalidateQueries({ queryKey: rulesKey(formId) });
    },
    onSuccess: () => toast.success("Rule removed."),
  });
}

/** Alias used by Module 2 components. */
export const useDeleteRule = useDeleteCondition;
