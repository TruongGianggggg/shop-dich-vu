"use client";

import {
  CSSProperties,
  TextareaHTMLAttributes,
  useLayoutEffect,
  useRef,
} from "react";

type AutosizeTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange" | "value"
> & {
  maxHeight?: number;
  minHeight?: number;
  onValueChange: (value: string) => void;
  value: string;
};

export function AutosizeTextarea({
  className = "",
  maxHeight = 300,
  maxLength = 5000,
  minHeight = 120,
  onValueChange,
  value,
  ...props
}: AutosizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = `${minHeight}px`;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, [maxHeight, minHeight, value]);

  const progress = maxLength ? Math.min((value.length / maxLength) * 100, 100) : 0;

  return (
    <div className="admin-autosize-textarea">
      <textarea
        {...props}
        className={`text-field admin-textarea ${className}`.trim()}
        maxLength={maxLength}
        onChange={(event) => onValueChange(event.target.value)}
        ref={textareaRef}
        style={{ maxHeight, minHeight }}
        value={value}
      />
      <div className="admin-textarea-counter" aria-live="polite">
        <span>{value.length}/{maxLength}</span>
        <span
          aria-hidden="true"
          className="admin-textarea-progress"
          style={{ "--textarea-progress": `${progress * 3.6}deg` } as CSSProperties}
        />
      </div>
    </div>
  );
}
