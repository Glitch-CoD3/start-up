import { requireSupabase } from '../../lib/supabase'
import { FEATURE_IMAGE_FOLDER, listPublicImages } from '../../lib/storageImages'
import { DEFAULT_HOMEPAGE_CONTENT } from './homepageContent'

const PRODUCT_FIELDS =
  'id,category_id,brand_id,product_name,url_slug,description,short_description,price,stock_quantity,status,created_at'
const VARIANT_FIELDS = 'id,product_id,colors,sizes,price,stock_quantity'
const IMAGE_FIELDS = 'id,product_variant_id,image_url,sort_order'
const PRICING_SCHEMA_ERROR_CODES = new Set(['42P01', '42703', 'PGRST204', 'PGRST205'])
const PRICING_MIGRATION_WARNING =
  'Product discounts and address-based delivery are not enabled yet. Run supabase_store_pricing.sql in the Supabase SQL Editor.'
const FEATURE_IMAGE_SELECTION_FUNCTION = 'get_homepage_feature_image'
const HOMEPAGE_CONTENT_FUNCTION = 'get_homepage_content'

function unwrap(result) {
  if (result.error) throw result.error
  return result.data ?? []
}

function isMissingPricingSchema(error) {
  const message = `${error.message ?? ''} ${error.details ?? ''}`
  return PRICING_SCHEMA_ERROR_CODES.has(error.code) &&
    /catalog_product_prices|discount_type|discount_value/i.test(message)
}

export function parseOptions(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (value == null || value === '') return []

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean)
      if (typeof parsed === 'string') return [parsed]
    } catch {
      return value.split(/[|,]/).map((option) => option.trim()).filter(Boolean)
    }
  }

  return [String(value)]
}

export async function getCatalog() {
  const client = await requireSupabase()
  let pricingAvailable = true
  let featuredImageSelectionAvailable = true
  let homepageContentAvailable = true
  const [productsResult, categoriesResult, brandsResult, variantsResult, pricingResult, reservationsResult, featuredImageResult, homepageContentResult, featureImages] =
    await Promise.all([
      client
        .from('products')
        .select(PRODUCT_FIELDS)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      client
        .from('categories')
        .select('id,category_name,url_slug,parent_category_id')
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('category_name'),
      client.from('brands').select('id,brand_name,logo').order('brand_name'),
      client
        .from('product_variants')
        .select(VARIANT_FIELDS)
        .is('deleted_at', null),
      client
        .from('catalog_product_prices')
        .select('product_id,variant_id,base_price,final_price,discount_amount')
        .then((result) => {
          if (!result.error) return result
          if (!isMissingPricingSchema(result.error)) throw result.error
          pricingAvailable = false
          console.warn(PRICING_MIGRATION_WARNING, result.error)
          return { data: [], error: null }
        }),
      client.rpc('get_active_stock_reservations'),
      client.rpc(FEATURE_IMAGE_SELECTION_FUNCTION).then((result) => {
        if (!result.error) return result
        if (result.error.code !== 'PGRST202' ||
          !result.error.message?.includes(FEATURE_IMAGE_SELECTION_FUNCTION)) throw result.error
        featuredImageSelectionAvailable = false
        console.warn(
          'Homepage feature image selection is not enabled; using the newest uploaded image. Run supabase_store_pricing.sql.',
          result.error,
        )
        return { data: null, error: null }
      }),
      client.rpc(HOMEPAGE_CONTENT_FUNCTION).then((result) => {
        if (!result.error) return result
        if (result.error.code !== 'PGRST202' ||
          !result.error.message?.includes(HOMEPAGE_CONTENT_FUNCTION)) throw result.error
        homepageContentAvailable = false
        console.warn(
          'Editable homepage copy is not enabled; using built-in defaults. Run supabase_store_pricing.sql.',
          result.error,
        )
        return { data: DEFAULT_HOMEPAGE_CONTENT, error: null }
      }),
      listPublicImages(FEATURE_IMAGE_FOLDER),
    ])

  const products = unwrap(productsResult)
  const categories = unwrap(categoriesResult)
  const brands = unwrap(brandsResult)
  const variants = unwrap(variantsResult)
  const prices = unwrap(pricingResult)
  const reservations = unwrap(reservationsResult) ?? []
  const reservedQuantityByStockId = new Map(
    reservations.map((reservation) => [
      `${reservation.product_id}:${reservation.product_variant_id ?? ''}`,
      Number(reservation.quantity),
    ]),
  )
  const pricesByProduct = new Map()
  const pricesByVariant = new Map()
  for (const price of prices) {
    if (price.variant_id) pricesByVariant.set(price.variant_id, price)
    else pricesByProduct.set(price.product_id, price)
  }
  const variantIds = variants.map((variant) => variant.id)
  let images = []

  if (variantIds.length) {
    images = unwrap(
      await client
        .from('variant_images')
        .select(IMAGE_FIELDS)
        .in('product_variant_id', variantIds)
        .order('sort_order'),
    )
  }

  const imagesByVariant = new Map()
  for (const image of images) {
    const variantImages = imagesByVariant.get(image.product_variant_id) ?? []
    variantImages.push(image.image_url)
    imagesByVariant.set(image.product_variant_id, variantImages)
  }

  const categoriesById = new Map(categories.map((category) => [category.id, category]))
  const brandsById = new Map(brands.map((brand) => [brand.id, brand]))
  const variantsByProduct = new Map()

  for (const variant of variants) {
    const productVariants = variantsByProduct.get(variant.product_id) ?? []
    productVariants.push({
      ...variant,
      stock_quantity: Math.max(
        0,
        Number(variant.stock_quantity || 0) -
          (reservedQuantityByStockId.get(`${variant.product_id}:${variant.id}`) ?? 0),
      ),
      base_price: Number(pricesByVariant.get(variant.id)?.base_price ?? variant.price),
      price: Number(pricesByVariant.get(variant.id)?.final_price ?? variant.price),
      discount_amount: Number(pricesByVariant.get(variant.id)?.discount_amount ?? 0),
      colors: parseOptions(variant.colors),
      sizes: parseOptions(variant.sizes),
      images: imagesByVariant.get(variant.id) ?? [],
    })
    variantsByProduct.set(variant.product_id, productVariants)
  }

  const catalogProducts = products.map((product) => {
    const productVariants = variantsByProduct.get(product.id) ?? []
    return {
      ...product,
      base_price: Number(pricesByProduct.get(product.id)?.base_price ?? product.price),
      price: Number(pricesByProduct.get(product.id)?.final_price ?? product.price),
      discount_amount: Number(pricesByProduct.get(product.id)?.discount_amount ?? 0),
      name: product.product_name,
      category: categoriesById.get(product.category_id)?.category_name ?? 'Essentials',
      categorySlug: categoriesById.get(product.category_id)?.url_slug ?? '',
      brand: brandsById.get(product.brand_id)?.brand_name ?? '',
      variants: productVariants,
      image: productVariants.flatMap((variant) => variant.images)[0] ?? '',
      stock:
        productVariants.length > 0
          ? productVariants.reduce(
              (total, variant) => total + Number(variant.stock_quantity || 0),
              0,
            )
          : Math.max(
              0,
              Number(product.stock_quantity || 0) -
                (reservedQuantityByStockId.get(`${product.id}:`) ?? 0),
            ),
    }
  })

  return {
    products: catalogProducts,
    featureImages,
    pricingWarning: pricingAvailable ? '' : PRICING_MIGRATION_WARNING,
    featuredImagePath: featuredImageSelectionAvailable ? featuredImageResult.data : null,
    homepageContent: homepageContentAvailable
      ? { ...DEFAULT_HOMEPAGE_CONTENT, ...homepageContentResult.data }
      : DEFAULT_HOMEPAGE_CONTENT,
    categories: categories.map((category) => ({
      ...category,
      name: category.category_name,
      slug: category.url_slug,
    })),
  }
}

export async function getProductBySlug(slug) {
  const { products } = await getCatalog()
  return (
    products.find((product) => product.url_slug === slug || product.id === slug) ??
    null
  )
}