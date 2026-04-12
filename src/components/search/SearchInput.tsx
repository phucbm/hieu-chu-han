"use client";

/**
 * SearchInput — Thanh tìm kiếm đơn giản
 * No search button — debounce + auto-suggest is handled by the parent.
 * Escape key calls onEscape callback.
 */

import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { X, Loader2 } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  onEscape?: () => void;
  /** Fired only when the <input> itself receives focus */
  onFocus?: () => void;
  placeholder?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      value,
      onChange,
      isLoading,
      onEscape,
      onFocus,
      placeholder = "Nhập chữ Hán, pinyin...",
    },
    ref
  ) {
    return (
      <div className="relative">
        <Input
          ref={ref}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onEscape?.();
              (ref as React.RefObject<HTMLInputElement>)?.current?.blur();
            }
          }}
          placeholder={placeholder}
          className="pr-8 text-base h-11"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Tìm kiếm chữ Hán"
          disabled={isLoading}
        />
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        {/* Clear button */}
        {!isLoading && value.length > 0 && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Xóa"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
