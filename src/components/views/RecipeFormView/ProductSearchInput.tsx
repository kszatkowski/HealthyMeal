import { useCallback, useEffect, useRef, useState } from "react";

import { useDebouncedCallback } from "use-debounce";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductListItemDto } from "@/types";

interface ProductSearchInputProps {
  value: ProductListItemDto | null;
  onChange: (value: ProductListItemDto | null) => void;
  onBlur?: () => void;
  disabled?: boolean;
  "aria-invalid"?: boolean | "true" | "false";
}

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_DELAY_MS = 250;

export function ProductSearchInput({ value, onChange, onBlur, disabled, ...ariaProps }: ProductSearchInputProps) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<ProductListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value?.name ?? "");
  }, [value]);

  const closeDropdown = useCallback(() => {
    setDropdownVisible(false);
  }, []);

  const performSearch = useCallback((term: string) => {
    abortRef.current?.abort();

    if (term.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      setError(term ? `Wpisz co najmniej ${MIN_QUERY_LENGTH} znaki` : null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    setError(null);

    fetch(`/api/products?search=${encodeURIComponent(term)}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Nie udało się pobrać listy produktów.");
        }
        return response.json() as Promise<{ items: ProductListItemDto[] }>;
      })
      .then((data) => {
        setResults(data.items ?? []);
      })
      .catch((searchError) => {
        if (searchError instanceof DOMException && searchError.name === "AbortError") {
          return;
        }
        setError(searchError instanceof Error ? searchError.message : "Wystąpił błąd wyszukiwania.");
        setResults([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const debouncedSearch = useDebouncedCallback(performSearch, DEBOUNCE_DELAY_MS);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextQuery = event.target.value;
      setQuery(nextQuery);
      setDropdownVisible(true);
      debouncedSearch(nextQuery);
    },
    [debouncedSearch]
  );

  const handleSelect = useCallback(
    (item: ProductListItemDto | null) => {
      onChange(item);
      setQuery(item?.name ?? "");
      closeDropdown();
    },
    [onChange, closeDropdown]
  );

  const handleBlur = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = setTimeout(() => {
      closeDropdown();
      onBlur?.();
    }, 150);
  }, [closeDropdown, onBlur]);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(
    () => () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      debouncedSearch.cancel();
    },
    [debouncedSearch]
  );

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setDropdownVisible(true)}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="Wyszukaj produkt"
          {...ariaProps}
        />
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => handleSelect(null)}
          >
            Wyczyść
          </Button>
        ) : null}
        {isLoading ? <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden /> : null}
      </div>

      {isDropdownVisible ? (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
          <div className="max-h-60 overflow-y-auto p-1 text-sm">
            {error ? (
              <p className="px-3 py-2 text-destructive">{error}</p>
            ) : results.length === 0 && !isLoading ? (
              <p className="px-3 py-2 text-muted-foreground">Brak wyników.</p>
            ) : (
              results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full rounded-md px-3 py-2 text-left hover:bg-muted"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(item)}
                >
                  {item.name}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
