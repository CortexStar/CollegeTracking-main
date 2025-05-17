import React, { useState, useEffect, useRef, KeyboardEvent, ReactNode } from "react";
import { Input } from "./input";

interface EditableProps {
  children: ReactNode;
  onEdit: () => void;
  align?: "left" | "center" | "right";
  "aria-label"?: string;
}

interface EditableSpanProps {
  value: string;
  onSave: (value?: string) => void;
  align?: "left" | "center" | "right";
  numeric?: boolean;
  "aria-label"?: string;
}

/**
 * Wraps content to make it appear editable
 * Provides seamless editing experience
 */
export const Editable: React.FC<EditableProps> = ({
  children,
  onEdit,
  align = "left",
  "aria-label": ariaLabel,
}) => {
  const isEmpty = !children || (typeof children === "string" && children.trim() === "");
  const handleClick = () => {
    // Single click for empty fields, double click for filled fields
    if (isEmpty) {
      onEdit();
    }
  };
  
  const handleDoubleClick = (e: React.MouseEvent) => {
    // Only trigger edit on double-click for non-empty fields
    if (!isEmpty) {
      e.stopPropagation();
      onEdit();
    }
  };

  const alignmentClass = 
    align === "center" ? "text-center" : 
    align === "right" ? "text-right" : 
    "text-left";

  return (
    <span
      className={`${alignmentClass} ${isEmpty ? "text-muted-foreground italic" : ""}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      aria-label={ariaLabel}
      role="button"
      tabIndex={0}
    >
      {isEmpty ? "Click to edit" : children}
    </span>
  );
};

/**
 * Editable span component that turns into an input field when active
 * Designed to be as seamless as possible
 */
export const EditableSpan: React.FC<EditableSpanProps> = ({
  value,
  onSave,
  align = "left",
  numeric = false,
  "aria-label": ariaLabel,
}) => {
  const [editedValue, setEditedValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      onSave(editedValue);
    } else if (e.key === "Escape") {
      onSave(); // Cancel editing
    }
  };

  const handleBlur = () => {
    onSave(editedValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (numeric) {
      // Allow only numeric input (including decimal)
      const value = e.target.value;
      if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
        setEditedValue(value);
      }
    } else {
      setEditedValue(e.target.value);
    }
  };

  const alignmentClass = 
    align === "center" ? "text-center" : 
    align === "right" ? "text-right" : 
    "text-left";

  return (
    <input
      ref={inputRef}
      type="text"
      value={editedValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onClick={(e) => e.stopPropagation()}
      className={`${alignmentClass} h-8 py-0 px-0 w-full border-none bg-transparent focus:ring-0 focus:outline-none`}
      aria-label={ariaLabel}
    />
  );
};