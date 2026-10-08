-- Run once in the Supabase SQL Editor after supabase_schema.sql.
-- Each brand belongs to one category; each category may have many brands.

ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS category_id UUID
    REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS brands_category_id_idx
  ON public.brands(category_id);

-- Preserve existing brand/category associations when all products for a brand
-- currently belong to the same category. Ambiguous brands remain unassigned
-- for an admin to resolve in the Brands page.
UPDATE public.brands AS brand
SET category_id = product_categories.category_id
FROM (
  SELECT brand_id, min(category_id::TEXT)::UUID AS category_id
  FROM public.products
  WHERE brand_id IS NOT NULL
    AND deleted_at IS NULL
  GROUP BY brand_id
  HAVING count(DISTINCT category_id) = 1
) AS product_categories
WHERE brand.id = product_categories.brand_id
  AND brand.category_id IS NULL;

NOTIFY pgrst, 'reload schema';
