import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type { PaginationMeta, RecipeListItemDto, RecipeListResponseDto } from "../../../types.ts";
import type { RecipeFiltersViewModel } from "./MyRecipesView.types";

export interface UseRecipesResult {
  recipes: RecipeListItemDto[];
  pagination: PaginationMeta;
  filters: RecipeFiltersViewModel;
  isLoading: boolean;
  error: Error | null;
  updateFilters: (partial: Partial<RecipeFiltersViewModel>) => void;
  deleteRecipe: (recipeId: string) => Promise<void>;
  reload: () => void;
}

const DEFAULT_LIMIT = 1;
const DEFAULT_SORT: RecipeFiltersViewModel["sort"] = "createdAt.desc";

const DEFAULT_FILTERS: RecipeFiltersViewModel = {
  sort: DEFAULT_SORT,
  page: 1,
  limit: DEFAULT_LIMIT,
};

const DEFAULT_PAGINATION: PaginationMeta = {
  total: 0,
  limit: DEFAULT_LIMIT,
  offset: 0,
};

function buildQuery(filters: RecipeFiltersViewModel): string {
  const params = new URLSearchParams();
  params.set("limit", filters.limit.toString());
  params.set("offset", ((filters.page - 1) * filters.limit).toString());
  params.set("sort", filters.sort);

  if (filters.mealType) {
    params.set("mealType", filters.mealType);
  }

  if (filters.difficulty) {
    params.set("difficulty", filters.difficulty);
  }

  if (filters.isAiGenerated !== undefined) {
    params.set("isAiGenerated", String(filters.isAiGenerated));
  }

  if (filters.search) {
    params.set("search", filters.search.trim());
  }

  return params.toString();
}

function parseErrorResponse(response: Response): Promise<string> {
  return response
    .json()
    .then((data: unknown) => {
      if (
        data &&
        typeof data === "object" &&
        "error" in data &&
        data.error &&
        typeof data.error === "object" &&
        data.error !== null &&
        "message" in data.error &&
        typeof (data as { error: { message?: unknown } }).error.message === "string"
      ) {
        return (data as { error: { message: string } }).error.message;
      }

      return "Unexpected error response.";
    })
    .catch(() => "Failed to parse error response.");
}

function areFiltersEqual(a: RecipeFiltersViewModel, b: RecipeFiltersViewModel): boolean {
  return (
    a.mealType === b.mealType &&
    a.difficulty === b.difficulty &&
    a.isAiGenerated === b.isAiGenerated &&
    a.search === b.search &&
    a.sort === b.sort &&
    a.page === b.page &&
    a.limit === b.limit
  );
}

export function useRecipes(): UseRecipesResult {
  const [recipes, setRecipes] = useState<RecipeListItemDto[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ ...DEFAULT_PAGINATION });
  const [filters, setFilters] = useState<RecipeFiltersViewModel>({ ...DEFAULT_FILTERS });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const previousRecipesRef = useRef<RecipeListItemDto[] | null>(null);
  const previousPaginationRef = useRef<PaginationMeta | null>(null);

  const updateFilters = useCallback((partial: Partial<RecipeFiltersViewModel>) => {
    setFilters((prev) => {
      const next: RecipeFiltersViewModel = {
        ...prev,
        ...partial,
      };

      if (next.page < 1) {
        next.page = 1;
      }

      const hasNonPageUpdates = Object.keys(partial).some((key) => key !== "page");

      if (partial.page === undefined && hasNonPageUpdates) {
        next.page = 1;
      }

      if (areFiltersEqual(next, prev)) {
        return prev;
      }

      return next;
    });
  }, []);

  const reload = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (filters.page < 1) {
      setFilters((prev) => {
        if (prev.page === 1) {
          return prev;
        }

        return {
          ...prev,
          page: 1,
        };
      });
      return;
    }

    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    const query = buildQuery(filters);

    fetch(`/api/recipes?${query}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          return parseErrorResponse(response).then((message) => {
            throw new Error(message);
          });
        }

        return response.json() as Promise<RecipeListResponseDto>;
      })
      .then((data) => {
        const fetchedPage = Math.floor(data.offset / data.limit) + 1;
        const totalPages = data.total === 0 ? 1 : Math.ceil(data.total / data.limit);

        if (fetchedPage > totalPages && totalPages >= 1) {
          setFilters((prev) => {
            if (prev.page === totalPages) {
              return prev;
            }

            return {
              ...prev,
              page: totalPages,
            };
          });
          return;
        }

        setRecipes(data.items);
        setPagination({
          total: data.total,
          limit: data.limit,
          offset: data.offset,
        });
        setFilters((prev) => {
          if (prev.page === fetchedPage && prev.limit === data.limit) {
            return prev;
          }

          return {
            ...prev,
            page: fetchedPage,
            limit: data.limit,
          };
        });
        setIsLoading(false);
      })
      .catch((fetchError) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setIsLoading(false);
        setError(fetchError instanceof Error ? fetchError : new Error("Failed to load recipes."));
      });

    return () => {
      controller.abort();
    };
  }, [filters, refreshToken]);

  const deleteRecipe = useCallback(
    async (recipeId: string) => {
      previousRecipesRef.current = recipes;
      previousPaginationRef.current = pagination;

      setRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));

      try {
        const response = await fetch(`/api/recipes/${recipeId}`, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          const message = await parseErrorResponse(response);
          throw new Error(message);
        }

        reload();
      } catch (deleteError) {
        const message = deleteError instanceof Error ? deleteError.message : "Nie udało się usunąć przepisu.";

        setRecipes(previousRecipesRef.current ?? []);
        setPagination(previousPaginationRef.current ?? { ...DEFAULT_PAGINATION });
        setError(deleteError instanceof Error ? deleteError : new Error(message));
        toast.error(message);

        throw deleteError;
      } finally {
        previousRecipesRef.current = null;
        previousPaginationRef.current = null;
      }
    },
    [pagination, recipes, reload]
  );

  return useMemo<UseRecipesResult>(
    () => ({
      recipes,
      pagination,
      filters,
      isLoading,
      error,
      updateFilters,
      deleteRecipe,
      reload,
    }),
    [recipes, pagination, filters, isLoading, error, updateFilters, deleteRecipe, reload]
  );
}
