import { supabaseClient } from "../../db/supabase.client.ts";
import type { ProductListItemDto, ProductListResponseDto } from "../../types.ts";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;
const DEFAULT_SORT: ProductListSort = "name.asc";

type ProductListSort = "name.asc" | "name.desc";

const PRODUCT_SORT_MAP: Record<ProductListSort, { column: "name"; ascending: boolean }> = {
  "name.asc": { column: "name", ascending: true },
  "name.desc": { column: "name", ascending: false },
};

export interface ListProductsParams {
  search?: string;
  limit?: number;
  offset?: number;
  sort?: ProductListSort;
}

type ProductServiceErrorCode = "invalid_query_params" | "internal_error";

export class ProductServiceError extends Error {
  constructor(
    public readonly code: ProductServiceErrorCode,
    message?: string,
    public readonly cause?: unknown
  ) {
    super(message ?? code);
    this.name = "ProductServiceError";
  }
}

export async function listProducts(params: ListProductsParams = {}): Promise<ProductListResponseDto> {
  const normalized = normalizeParams(params);

  const filter = buildFilter(normalized.search);

  const dataQuery = supabaseClient
    .from("products")
    .select("id, name")
    .order(PRODUCT_SORT_MAP[normalized.sort].column, {
      ascending: PRODUCT_SORT_MAP[normalized.sort].ascending,
    })
    .range(normalized.offset, normalized.offset + normalized.limit - 1);

  if (filter) {
    dataQuery.ilike("name", filter);
  }

  const { data, error } = await dataQuery;

  if (error) {
    throw new ProductServiceError("internal_error", "Failed to fetch products.", error);
  }

  const countQuery = supabaseClient.from("products").select("id", { count: "exact", head: true });

  if (filter) {
    countQuery.ilike("name", filter);
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    throw new ProductServiceError("internal_error", "Failed to count products.", countError);
  }

  const items = (data ?? []).map<ProductListItemDto>((row) => ({
    id: row.id,
    name: row.name,
  }));

  return {
    items,
    total: count ?? 0,
    limit: normalized.limit,
    offset: normalized.offset,
  } satisfies ProductListResponseDto;
}

function normalizeParams(params: ListProductsParams): Required<ListProductsParams> {
  const limit = clampInteger(params.limit, 1, MAX_LIMIT, DEFAULT_LIMIT);
  const offset = clampInteger(params.offset, 0, Number.MAX_SAFE_INTEGER, DEFAULT_OFFSET);
  const sort = params.sort ?? DEFAULT_SORT;

  if (!(sort in PRODUCT_SORT_MAP)) {
    throw new ProductServiceError("invalid_query_params", "Unsupported sort parameter.");
  }

  return {
    search: params.search?.trim() ?? "",
    limit,
    offset,
    sort,
  };
}

function clampInteger(value: number | undefined, min: number, max: number, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  if (!Number.isInteger(value)) {
    throw new ProductServiceError("invalid_query_params", "Pagination values must be integers.");
  }

  if (value < min || value > max) {
    throw new ProductServiceError("invalid_query_params", "Pagination values are out of range.");
  }

  return value;
}

function buildFilter(search?: string): string | undefined {
  if (!search) {
    return undefined;
  }

  const sanitized = escapeSearchTerm(search);
  return `%${sanitized}%`;
}

function escapeSearchTerm(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
