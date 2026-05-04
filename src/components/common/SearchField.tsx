import { forwardRef, useId, useRef, type InputHTMLAttributes, type Ref } from "react";
import { Search, X } from "lucide-react";

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  hideLabel?: boolean;
  onClear?: () => void;
  inputClassName?: string;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ label, hideLabel = true, id, value, className = "", inputClassName = "", onClear, disabled, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const inputRef = useRef<HTMLInputElement | null>(null);
    const hasValue = String(value ?? "").length > 0;

    const handleClear = () => {
      const input = inputRef.current;

      if (input) {
        const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        valueSetter?.call(input, "");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
      }

      onClear?.();
    };

    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        <label
          htmlFor={inputId}
          className={hideLabel ? "sr-only" : "text-sm font-medium"}
          style={hideLabel ? undefined : { color: "var(--text-secondary)" }}
        >
          {label}
        </label>
        <div
          className="flex items-center rounded-xl border px-3 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary-500/60 focus-within:border-primary-400"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-default)",
          }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: "var(--text-tertiary)" }} aria-hidden="true" />
          <input
            ref={(node) => {
              inputRef.current = node;
              assignRef(ref, node);
            }}
            id={inputId}
            type="search"
            value={value}
            disabled={disabled}
            className={`min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-[var(--text-tertiary)] disabled:cursor-not-allowed disabled:opacity-50 ${inputClassName}`}
            style={{ color: "var(--text-primary)" }}
            {...rest}
          />
          {hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:hover:bg-primary-950/30"
              aria-label={`Clear ${label}`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    );
  },
);

SearchField.displayName = "SearchField";

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  ref.current = value;
}
