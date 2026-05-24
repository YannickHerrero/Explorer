import { useEffect, useRef, useState } from "react";

interface PromptModalProps {
  open: boolean;
  title: string;
  initialValue?: string;
  submitLabel?: string;
  selectRange?: "all" | "basename";
  placeholder?: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}

export function PromptModal({
  open,
  title,
  initialValue = "",
  submitLabel = "OK",
  selectRange = "all",
  placeholder,
  onSubmit,
  onClose,
}: PromptModalProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setValue(initialValue);
    setTimeout(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      if (selectRange === "basename") {
        const dot = initialValue.lastIndexOf(".");
        const end = dot > 0 ? dot : initialValue.length;
        input.setSelectionRange(0, end);
      } else {
        input.select();
      }
    }, 20);
  }, [open, initialValue, selectRange]);

  if (!open) return null;

  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0;
  const submit = () => {
    if (!canSubmit) return;
    onSubmit(trimmed);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(var(--shadow), 0.25)",
        zIndex: 70,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 120,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: "90%",
          background: "var(--paper-alt)",
          borderRadius: 8,
          border: "1px solid var(--line)",
          boxShadow: "0 20px 60px rgba(var(--shadow), 0.25)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid var(--line)",
            fontFamily: "var(--font-serif)",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--ink)",
          }}
        >
          {title}
        </div>
        <div style={{ padding: 14 }}>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
            }}
            placeholder={placeholder}
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px solid var(--line)",
              borderRadius: 5,
              background: "var(--paper)",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              color: "var(--ink)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div
          style={{
            padding: "10px 14px",
            borderTop: "1px solid var(--line)",
            background: "var(--paper-deep)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "6px 14px",
              border: "1px solid var(--line)",
              borderRadius: 5,
              background: "var(--paper)",
              color: "var(--ink-soft)",
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            style={{
              padding: "6px 14px",
              border: "none",
              borderRadius: 5,
              background: canSubmit ? "var(--accent)" : "var(--paper-deep)",
              color: canSubmit ? "var(--paper)" : "var(--muted)",
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              fontWeight: 500,
              cursor: canSubmit ? "pointer" : "default",
            }}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
