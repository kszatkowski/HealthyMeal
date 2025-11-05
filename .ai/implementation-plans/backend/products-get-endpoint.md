# Decommission Plan: GET /api/products

The former `/api/products` endpoint surfaced a catalogue of predefined ingredients used to drive preference management and ingredient pickers. With preference notes now stored as free text, the product catalogue is no longer required in the MVP. This document replaces the previous implementation plan with a clean-up checklist.

## 1. Scope of Removal

- Delete the Astro API route at `src/pages/api/products/index.ts` (if it exists).
- Remove supporting modules such as `products.service.ts`, DTO definitions, and Zod schemas dedicated to product lookup.
- Ensure no remaining code paths depend on product IDs (recipe ingredients already use plain text in the updated schema).

## 2. Database Changes

- Drop the `products` table once all code paths are migrated. Use a guarded migration to keep deployments idempotent:

```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    DROP TABLE public.products;
  END IF;
END$$;
```

- Remove seed data migrations related to `products` (or mark them as deprecated if history must remain intact).

## 3. API & Validation Cleanup

- Eliminate error codes such as `product_not_found` and `unknown_product` from shared error registries.
- Update any middleware, caching layers, or rate limiters that referenced `/api/products`.
- Confirm the API documentation reflects the new profile-based preference strategy (see `api-plan.md`).

## 4. Frontend Follow-up

- Replace `ProductSearchInput` and related combobox components with simple text inputs/textarea fields.
- Adjust form validation to enforce the 200-character limit rather than checking for valid product IDs.
- Update tests (unit, integration, E2E) to remove catalogue expectations and assert text-only behaviour.

## 5. Communication

- Document the removal in release notes or CHANGELOG so stakeholders know the catalogue is no longer available.
- Align UX/UI copy (tooltips, placeholders) with the expectation that users list ingredients manually.

## 6. Rollout Checklist

1. Remove backend route, service, and DTOs related to products.
2. Drop the `products` table through a guarded migration.
3. Refactor frontend components and tests.
4. Run regression tests (`npm run test`, `npm run e2e`).
5. Update documentation and notify the team.

