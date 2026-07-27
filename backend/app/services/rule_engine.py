from typing import List, Dict, Any, Optional
from uuid import UUID
from pydantic import BaseModel

class RuleDTO(BaseModel):
    id: UUID
    source_field_id: UUID
    target_field_id: UUID
    operator: str
    value: Optional[str] = None
    action: str
    logic_group: Optional[str] = None

class FieldState(BaseModel):
    field_id: UUID
    visible: bool = True
    required: bool = False
    disabled: bool = False

class RuleEngine:
    @staticmethod
    def _evaluate_condition(operator: str, field_value: Any, rule_value: str) -> bool:
        # Normalize inputs
        fv_str = "" if field_value is None else str(field_value).strip()
        rv_str = "" if rule_value is None else str(rule_value).strip()

        if operator == "is_empty":
            return fv_str == "" or fv_str == "[]"
        if operator == "is_not_empty":
            return fv_str != "" and fv_str != "[]"

        if operator == "equals":
            return fv_str.lower() == rv_str.lower()
        if operator == "not_equals":
            return fv_str.lower() != rv_str.lower()
        if operator == "contains":
            return rv_str.lower() in fv_str.lower()
        if operator == "greater_than":
            try:
                return float(fv_str) > float(rv_str)
            except ValueError:
                return fv_str > rv_str
        if operator == "less_than":
            try:
                return float(fv_str) < float(rv_str)
            except ValueError:
                return fv_str < rv_str

        return False

    def evaluate(
        self,
        rules: List[RuleDTO],
        field_ids: List[UUID],
        values: Dict[UUID, Any]
    ) -> Dict[UUID, FieldState]:
        # Initialize default state for all fields
        # Note: by default, we assume fields are visible=True, required=False (base required is set per field later), disabled=False
        states: Dict[UUID, FieldState] = {
            fid: FieldState(field_id=fid, visible=True, required=False, disabled=False)
            for fid in field_ids
        }

        # Group rules by target_field_id
        target_rules: Dict[UUID, List[RuleDTO]] = {}
        for rule in rules:
            target_rules.setdefault(rule.target_field_id, []).append(rule)

        # For each target field, check if it has rules
        for target_id, r_list in target_rules.items():
            if target_id not in states:
                continue

            # Group rules by logic_group
            groups: Dict[Optional[str], List[RuleDTO]] = {}
            for r in r_list:
                groups.setdefault(r.logic_group, []).append(r)

            # Evaluate each logic group. A logic group is active if all its rules match (AND).
            # If a rule has no logic group (None), it forms its own group of size 1.
            active_actions = []
            for g_name, g_rules in groups.items():
                if g_name is None:
                    # Individual OR rules
                    for r in g_rules:
                        matched = self._evaluate_condition(
                            operator=r.operator,
                            field_value=values.get(r.source_field_id),
                            rule_value=r.value
                        )
                        if matched:
                            active_actions.append(r.action)
                else:
                    # AND logic group
                    group_matched = True
                    for r in g_rules:
                        matched = self._evaluate_condition(
                            operator=r.operator,
                            field_value=values.get(r.source_field_id),
                            rule_value=r.value
                        )
                        if not matched:
                            group_matched = False
                            break
                    if group_matched and g_rules:
                        # Append the action of the first rule in the active group
                        active_actions.append(g_rules[0].action)

            # Apply actions
            # If there are any "show" rules defined for this target field:
            # - By default, it is hidden.
            # - It becomes visible only if at least one "show" rule matches.
            has_show_rules = any(r.action == "show" for r in r_list)
            if has_show_rules:
                states[target_id].visible = "show" in active_actions

            # If there are any "hide" rules:
            # - It is visible by default.
            # - It becomes hidden if any "hide" rule matches.
            has_hide_rules = any(r.action == "hide" for r in r_list)
            if has_hide_rules and "hide" in active_actions:
                states[target_id].visible = False

            # If there are any "require" rules:
            # - It becomes required if any "require" rule matches.
            has_require_rules = any(r.action == "require" for r in r_list)
            if has_require_rules and "require" in active_actions:
                states[target_id].required = True

            # If there are any "disable" rules:
            # - It becomes disabled if any "disable" rule matches.
            has_disable_rules = any(r.action == "disable" for r in r_list)
            if has_disable_rules and "disable" in active_actions:
                states[target_id].disabled = True

        return states
