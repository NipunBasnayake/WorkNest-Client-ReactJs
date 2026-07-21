import { useId, useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/common/Button";
import type { EmployeeSkillPayload, SkillSuggestion } from "@/modules/employees/types";
import {
  getSkillKey,
  MAX_EMPLOYEE_SKILLS,
  normalizeSkillName,
} from "@/modules/employees/utils/employeeSkills";

interface EmployeeSkillsFieldProps {
  skills: EmployeeSkillPayload[];
  suggestions: SkillSuggestion[];
  error?: string;
  onChange: (skills: EmployeeSkillPayload[]) => void;
}

export function EmployeeSkillsField({
  skills,
  suggestions,
  error,
  onChange,
}: EmployeeSkillsFieldProps) {
  const suggestionListId = useId();
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const selectedKeys = new Set(skills.map((skill) => getSkillKey(skill.name)));
  const availableSuggestions = suggestions.filter((suggestion) => !selectedKeys.has(getSkillKey(suggestion.name)));
  const resolvedError = localError ?? error;
  const atLimit = skills.length >= MAX_EMPLOYEE_SKILLS;

  function addSkill() {
    const normalizedName = normalizeSkillName(draft);
    if (!normalizedName) {
      setLocalError("Enter a skill name first.");
      return;
    }
    if (normalizedName.length > 120) {
      setLocalError("Skill names must not exceed 120 characters.");
      return;
    }
    if (atLimit) {
      setLocalError(`An employee can have at most ${MAX_EMPLOYEE_SKILLS} skills.`);
      return;
    }
    if (selectedKeys.has(getSkillKey(normalizedName))) {
      setLocalError(`${normalizedName} is already selected.`);
      return;
    }

    onChange([...skills, { name: normalizedName }]);
    setDraft("");
    setLocalError(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addSkill();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label htmlFor={`${suggestionListId}-input`} className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Skills
          </label>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
            Choose a suggestion or type a new skill, then add it.
          </p>
        </div>
        <span className="shrink-0 text-xs font-semibold" style={{ color: atLimit ? "var(--color-warning-600)" : "var(--text-tertiary)" }}>
          {skills.length}/{MAX_EMPLOYEE_SKILLS}
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={`${suggestionListId}-input`}
          list={suggestionListId}
          value={draft}
          maxLength={120}
          disabled={atLimit}
          placeholder={atLimit ? "Maximum of 10 skills reached" : "e.g. React"}
          className="min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: resolvedError ? "var(--color-danger-500)" : "var(--border-default)",
            color: "var(--text-primary)",
          }}
          aria-invalid={Boolean(resolvedError)}
          aria-describedby={resolvedError ? `${suggestionListId}-error` : undefined}
          onChange={(event) => {
            setDraft(event.target.value);
            setLocalError(null);
          }}
          onKeyDown={handleKeyDown}
        />
        <datalist id={suggestionListId}>
          {availableSuggestions.map((suggestion) => (
            <option key={getSkillKey(suggestion.name)} value={suggestion.name} />
          ))}
        </datalist>
        <Button type="button" variant="outline" onClick={addSkill} disabled={atLimit || !draft.trim()}>
          <Plus size={16} />
          Add skill
        </Button>
      </div>

      {resolvedError && (
        <p id={`${suggestionListId}-error`} role="alert" className="text-xs" style={{ color: "var(--color-danger-600)" }}>
          {resolvedError}
        </p>
      )}

      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2" aria-label="Selected skills">
          {skills.map((skill) => (
            <span
              key={getSkillKey(skill.name)}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium"
              style={{
                backgroundColor: "var(--brand-soft)",
                borderColor: "var(--brand-border)",
                color: "var(--text-primary)",
              }}
            >
              {skill.name}
              <button
                type="button"
                className="rounded-full p-0.5 transition hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 dark:hover:bg-white/10"
                aria-label={`Remove ${skill.name}`}
                onClick={() => {
                  onChange(skills.filter((item) => getSkillKey(item.name) !== getSkillKey(skill.name)));
                  setLocalError(null);
                }}
              >
                <X size={13} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>No skills selected.</p>
      )}
    </div>
  );
}
