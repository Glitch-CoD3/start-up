import { requireSupabase } from '../../lib/supabase'
import { deleteUnusedProductImages } from './storage'

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
]

const PRODUCT_FIELDS =
  'id,category_id,brand_id,product_name,url_slug,description,short_description,price,discount_type,discount_value,stock_quantity,status,created_at,updated_at'
const LEGACY_PRODUCT_FIELDS =
  'id,category_id,brand_id,product_name,url_slug,description,short_description,price,stock_quantity,status,created_at,updated_at'
const VARIANT_FIELDS =
  'id,product_id,colors,sizes,price,stock_quantity,created_at,updated_at'

function unwrap({ data, error }) {
  if (error) throw error
  return data
}

function isMissingDiscountColumns(error) {
  return ['42703', 'PGRST204'].includes(error.code) &&
    /discount_type|discount_value/i.test(`${error.message ?? ''} ${error.details ?? ''}`)
}

async function loadProducts(client, id = null) {
  const queryProducts = (fields) => {
    let query = client.from('products').select(fields).is('deleted_at', null)
    if (id) return query.eq('id', id).maybeSingle()
    return query.order('created_at', { ascending: false })
  }
  const result = await queryProducts(PRODUCT_FIELDS)
  if (!result.error) return result.data
  if (!isMissingDiscountColumns(result.error)) throw result.error

  console.warn('Product discount columns are not installed; loading products without discounts.', result.error)
  return unwrap(await queryProducts(LEGACY_PRODUCT_FIELDS))
}

async function loadProductRelations(client, products) {
  if (!products.length) return products
  const productIds = products.map((product) => product.id)
  const categoryIds = [...new Set(products.map((product) => product.category_id))]
  const brandIds = [...new Set(products.map((product) => product.brand_id).filter(Boolean))]
  const [categories, brands, variants] = await Promise.all([
    categoryIds.length
      ? client.from('categories').select('id,category_name').in('id', categoryIds)
      : Promise.resolve({ data: [], error: null }),
    brandIds.length
      ? client.from('brands').select('id,brand_name').in('id', brandIds)
      : Promise.resolve({ data: [], error: null }),
    client
      .from('product_variants')
      .select(VARIANT_FIELDS)
      .in('product_id', productIds)
      .is('deleted_at', null),
  ])
  const categoryRows = unwrap(categories) ?? []
  const brandRows = unwrap(brands) ?? []
  const variantRows = unwrap(variants) ?? []
  const categoryById = new Map(categoryRows.map((row) => [row.id, row]))
  const brandById = new Map(brandRows.map((row) => [row.id, row]))
  const variantsByProduct = new Map()
  for (const variant of variantRows) {
    const grouped = variantsByProduct.get(variant.product_id) ?? []
    grouped.push(variant)
    variantsByProduct.set(variant.product_id, grouped)
  }

  return products.map((product) => ({
    ...product,
    category_name: categoryById.get(product.category_id)?.category_name ?? '',
    brand_name: brandById.get(product.brand_id)?.brand_name ?? '',
    variants: variantsByProduct.get(product.id) ?? [],
  }))
}

export async function getAdminProducts() {
  const client = await requireSupabase()
  const products = await loadProducts(client)
  return loadProductRelations(client, products ?? [])
}

export async function getAdminProduct(id) {
  const client = await requireSupabase()
  const product = await loadProducts(client, id)
  if (!product) return null

  const [relations, variants] = await Promise.all([
    loadProductRelations(client, [product]),
    client
      .from('product_variants')
      .select(VARIANT_FIELDS)
      .eq('product_id', id)
      .is('deleted_at', null)
      .order('created_at'),
  ])
  const variantRows = unwrap(variants) ?? []
  if (variantRows.length) {
    const images = unwrap(
      await client
        .from('variant_images')
        .select('id,product_variant_id,image_url,sort_order')
        .in('product_variant_id', variantRows.map((variant) => variant.id))
        .is('deleted_at', null)
        .order('sort_order'),
    ) ?? []
    const imagesByVariant = new Map()
    for (const image of images) {
      const grouped = imagesByVariant.get(image.product_variant_id) ?? []
      grouped.push(image.image_url)
      imagesByVariant.set(image.product_variant_id, grouped)
    }
    relations[0].variants = variantRows.map((variant) => ({
      ...variant,
      images: imagesByVariant.get(variant.id) ?? [],
    }))
  }
  return relations[0]
}

export async function getProductOptions() {
  const client = await requireSupabase()
  const [categories, brands] = await Promise.all([
    client.from('categories').select('id,category_name').eq('status', 'active').is('deleted_at', null).order('category_name'),
    client.from('brands').select('id,brand_name,category_id').order('brand_name'),
  ])
  return { categories: unwrap(categories) ?? [], brands: unwrap(brands) ?? [] }
}

export async function getAdminCategories() {
  const client = await requireSupabase()
  const categories = unwrap(
    await client
      .from('categories')
      .select('id,category_name,url_slug,parent_category_id,status,created_at')
      .is('deleted_at', null)
      .order('category_name'),
  ) ?? []
  const parentIds = [...new Set(categories.map((category) => category.parent_category_id).filter(Boolean))]
  const parents = parentIds.length
    ? unwrap(await client.from('categories').select('id,category_name').in('id', parentIds)) ?? []
    : []
  const parentNames = new Map(parents.map((parent) => [parent.id, parent.category_name]))
  return categories.map((category) => ({
    ...category,
    parent_name: parentNames.get(category.parent_category_id) ?? '',
  }))
}

export async function saveAdminCategory(category) {
  const name = category.category_name.trim()
  const slug = category.url_slug.trim()
  if (!name || !slug) throw new Error('Category name and URL slug are required.')
  if (category.id && category.parent_category_id === category.id) {
    throw new Error('A category cannot be its own parent.')
  }
  const client = await requireSupabase()
  const values = {
    category_name: name,
    url_slug: slug,
    parent_category_id: category.parent_category_id || null,
    status: category.status,
  }
  const result = category.id
    ? await client.from('categories').update(values).eq('id', category.id)
    : await client.from('categories').insert(values)
  if (result.error) throw result.error
}

export async function setAdminCategoryStatus(categoryId, status) {
  const client = await requireSupabase()
  const result = status === 'deleted'
    ? await client.from('categories').update({ deleted_at: new Date().toISOString() }).eq('id', categoryId)
    : await client.from('categories').update({ status }).eq('id', categoryId)
  if (result.error) throw result.error
}

export async function getAdminBrands() {
  const client = await requireSupabase()
  const [brands, categories] = await Promise.all([
    client.from('brands').select('id,brand_name,logo,category_id,created_at').order('brand_name'),
    client.from('categories').select('id,category_name'),
  ])
  const categoryNames = new Map((unwrap(categories) ?? []).map((category) => [category.id, category.category_name]))
  return (unwrap(brands) ?? []).map((brand) => ({
    ...brand,
    category_name: categoryNames.get(brand.category_id) ?? '',
  }))
}

export async function saveAdminBrand(brand) {
  const name = brand.brand_name.trim()
  if (!name || !brand.category_id) throw new Error('Brand name and category are required.')
  const client = await requireSupabase()
  const values = { brand_name: name, category_id: brand.category_id, logo: brand.logo.trim() || null }
  const result = brand.id
    ? await client.from('brands').update(values).eq('id', brand.id)
    : await client.from('brands').insert(values)
  if (result.error) throw result.error
}

function normalizeVariant(variant) {
  const price = Number(variant.price)
  const stock = Number(variant.stock_quantity)
  if (!Number.isFinite(price) || price < 0) throw new Error('Variant price must be zero or greater.')
  if (!Number.isInteger(stock) || stock < 0) throw new Error('Variant stock must be a non-negative whole number.')
  if (variant.sizes && !['M', 'L', 'XL', 'XXL', '3XL'].includes(variant.sizes)) {
    throw new Error('Choose a valid product size.')
  }
  return {
    id: variant.id,
    colors: variant.colors.trim() || null,
    sizes: variant.sizes || null,
    price,
    stock_quantity: stock,
    images: variant.images.map((url) => url.trim()).filter(Boolean),
  }
}

export async function saveAdminProduct(productInput) {
  const client = await requireSupabase()
  const name = productInput.product_name.trim()
  const slug = productInput.url_slug.trim()
  if (!name || !slug || !productInput.category_id) {
    throw new Error('Product name, slug, and category are required.')
  }
  const variants = productInput.variants.map(normalizeVariant)
  const stock = variants.length
    ? variants.reduce((total, variant) => total + variant.stock_quantity, 0)
    : Number(productInput.stock_quantity || 0)
  if (!Number.isInteger(stock) || stock < 0) throw new Error('Stock must be a non-negative whole number.')

  const productValues = {
    category_id: productInput.category_id,
    brand_id: productInput.brand_id || null,
    product_name: name,
    url_slug: slug,
    description: productInput.description.trim() || null,
    short_description: productInput.short_description.trim() || null,
    price: Number(productInput.price),
    discount_type: productInput.discount_type || 'none',
    discount_value: Number(productInput.discount_value || 0),
    stock_quantity: stock,
    status: productInput.status,
  }
  if (productValues.brand_id) {
    const { data: brand, error: brandError } = await client
      .from('brands')
      .select('id')
      .eq('id', productValues.brand_id)
      .eq('category_id', productValues.category_id)
      .maybeSingle()
    if (brandError) throw brandError
    if (!brand) throw new Error('Choose a brand assigned to the selected category.')
  }
  if (!Number.isFinite(productValues.price) || productValues.price < 0) {
    throw new Error('Product price must be zero or greater.')
  }
  if (!['none', 'fixed', 'percentage'].includes(productValues.discount_type)) {
    throw new Error('Choose a valid product discount type.')
  }
  if (
    !Number.isFinite(productValues.discount_value) ||
    productValues.discount_value < 0 ||
    (productValues.discount_type === 'percentage' && productValues.discount_value > 100)
  ) {
    throw new Error('Enter a valid discount value.')
  }

  const savedProduct = productInput.id
    ? unwrap(
        await client.from('products').update(productValues).eq('id', productInput.id).select('id').single(),
      )
    : unwrap(await client.from('products').insert(productValues).select('id').single())
  const productId = savedProduct.id
  const existingVariants = productInput.id
    ? unwrap(
        await client
          .from('product_variants')
          .select('id')
          .eq('product_id', productId)
          .is('deleted_at', null),
      ) ?? []
    : []
  const existingVariantIds = existingVariants.map((variant) => variant.id)
  const existingImages = existingVariantIds.length
    ? unwrap(
        await client
          .from('variant_images')
          .select('image_url')
          .in('product_variant_id', existingVariantIds)
          .is('deleted_at', null),
      ) ?? []
    : []
  const retainedVariantIds = new Set()

  for (const variant of variants) {
    const { images: imageUrls, ...variantValues } = variant
    let variantId = variant.id
    if (variantId) {
      if (!existingVariants.some((row) => row.id === variantId)) {
        throw new Error('A variant does not belong to this product.')
      }
      unwrap(
        await client
          .from('product_variants')
          .update(variantValues)
          .eq('id', variantId)
          .eq('product_id', productId),
      )
      retainedVariantIds.add(variantId)
      unwrap(
        await client
          .from('variant_images')
          .update({ deleted_at: new Date().toISOString() })
          .eq('product_variant_id', variantId)
          .is('deleted_at', null),
      )
    } else {
      const created = unwrap(
        await client
          .from('product_variants')
          .insert({ ...variantValues, product_id: productId })
          .select('id')
          .single(),
      )
      variantId = created.id
      retainedVariantIds.add(variantId)
    }
    if (imageUrls.length) {
      unwrap(
        await client.from('variant_images').insert(
          imageUrls.map((image_url, index) => ({
            product_variant_id: variantId,
            image_url,
            sort_order: index + 1,
          })),
        ),
      )
    }
  }

  const removedVariantIds = existingVariants
    .map((variant) => variant.id)
    .filter((id) => !retainedVariantIds.has(id))
  if (removedVariantIds.length) {
    unwrap(
      await client
        .from('product_variants')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', removedVariantIds),
    )
    unwrap(
      await client
        .from('variant_images')
        .update({ deleted_at: new Date().toISOString() })
        .in('product_variant_id', removedVariantIds)
        .is('deleted_at', null),
    )
  }
  const retainedImageUrls = new Set(variants.flatMap((variant) => variant.images))
  const removedImageUrls = [...new Set(existingImages.map((image) => image.image_url))]
    .filter((url) => !retainedImageUrls.has(url))
  return { productId, removedImageUrls }
}

export async function deleteAdminProduct(id) {
  const client = await requireSupabase()
  const variants = unwrap(
    await client
      .from('product_variants')
      .select('id')
      .eq('product_id', id)
      .is('deleted_at', null),
  ) ?? []
  const variantIds = variants.map((variant) => variant.id)
  const imageRows = variantIds.length
    ? unwrap(
        await client
          .from('variant_images')
          .select('image_url')
          .in('product_variant_id', variantIds)
          .is('deleted_at', null),
      ) ?? []
    : []
  unwrap(
    await client
      .from('products')
      .update({ deleted_at: new Date().toISOString(), status: 'inactive' })
      .eq('id', id)
      .is('deleted_at', null),
  )
  if (variantIds.length) {
    const deletedAt = new Date().toISOString()
    unwrap(
      await client
        .from('variant_images')
        .update({ deleted_at: deletedAt })
        .in('product_variant_id', variantIds)
        .is('deleted_at', null),
    )
    unwrap(
      await client
        .from('product_variants')
        .update({ deleted_at: deletedAt })
        .in('id', variantIds)
        .is('deleted_at', null),
    )
  }

  let cleanupWarning = ''
  try {
    await deleteUnusedProductImages(imageRows.map((image) => image.image_url))
  } catch (cause) {
    console.error('Product archived, but its images could not be deleted.', cause)
    cleanupWarning = cause.message || 'The product images could not be deleted.'
  }
  return { cleanupWarning }
}

export async function getInventory() {
  const client = await requireSupabase()
  const products = unwrap(
    await client
      .from('products')
      .select('id,category_id,product_name,stock_quantity')
      .is('deleted_at', null)
      .order('product_name'),
  ) ?? []
  const variants = unwrap(
    await client
      .from('product_variants')
      .select('id,product_id,colors,sizes,price,stock_quantity')
      .is('deleted_at', null)
      .order('created_at'),
  ) ?? []
  const categoryIds = [...new Set(products.map((product) => product.category_id).filter(Boolean))]
  const categories = unwrap(
    categoryIds.length
     ? await client.from('categories').select('id,category_name').in('id', categoryIds)
     : { data: [], error: null },
  ) ?? []
  const productById = new Map(products.map((product) => [product.id, product]))
  const categoryById = new Map(categories.map((category) => [category.id, category.category_name]))
  const productIdsWithVariants = new Set(variants.map((variant) => variant.product_id))
  return variants
    .filter((variant) => productById.has(variant.product_id))
    .map((variant) => {
      const product = productById.get(variant.product_id)
      return {
        ...variant,
        category_id: product.category_id ?? '__uncategorized__',
        category_name: categoryById.get(product.category_id) ?? 'Uncategorized',
        product_name: product.product_name,
      }
    })
    .concat(
      products
        .filter((product) => !productIdsWithVariants.has(product.id))
        .map((product) => ({
          id: product.id,
          product_id: product.id,
          category_id: product.category_id ?? '__uncategorized__',
          category_name: categoryById.get(product.category_id) ?? 'Uncategorized',
          product_name: product.product_name,
          colors: null,
          sizes: null,
          stock_quantity: product.stock_quantity,
          is_product_stock: true,
        })),
    )
}

export async function updateVariantStock(inventoryItem, quantity) {
  const stock = Number(quantity)
  if (!Number.isInteger(stock) || stock < 0) throw new Error('Stock must be a non-negative whole number.')
  const client = await requireSupabase()
  if (inventoryItem.is_product_stock) {
    unwrap(
      await client
        .from('products')
        .update({ stock_quantity: stock })
        .eq('id', inventoryItem.product_id),
    )
    return
  }
  const variant = unwrap(
    await client
      .from('product_variants')
      .update({ stock_quantity: stock })
      .eq('id', inventoryItem.id)
      .select('product_id')
      .single(),
  )
  const siblings = unwrap(
    await client
      .from('product_variants')
      .select('stock_quantity')
      .eq('product_id', variant.product_id)
      .is('deleted_at', null),
  ) ?? []
  unwrap(
    await client
      .from('products')
      .update({ stock_quantity: siblings.reduce((sum, row) => sum + Number(row.stock_quantity || 0), 0) })
      .eq('id', variant.product_id),
  )
}

export async function getAdminOrders() {
  const client = await requireSupabase()
  const orders = unwrap(
    await client
      .from('orders')
      .select('id,order_number,user_id,total_amount,net_amount,status,payment_status,payment_method,payment_account_reference,transaction_number,created_at')
      .order('created_at', { ascending: false }),
  ) ?? []
  if (!orders.length) return []
  const userIds = [...new Set(orders.map((order) => order.user_id))]
  const customers = unwrap(
    await client.from('users').select('id,full_name,phone_number').in('id', userIds),
  ) ?? []
  const customerById = new Map(customers.map((customer) => [customer.id, customer]))
  return orders.map((order) => ({ ...order, customer: customerById.get(order.user_id) ?? null }))
}

export async function getAdminOrder(id) {
  const client = await requireSupabase()
  const order = unwrap(
    await client
      .from('orders')
      .select('id,order_number,user_id,total_amount,discount_amount,shipping_charge,net_amount,status,payment_status,payment_method,payment_account_reference,transaction_number,created_at,updated_at')
      .eq('id', id)
      .maybeSingle(),
  )
  if (!order) return null
  const [items, addresses, customer] = await Promise.all([
    client
      .from('order_items')
      .select('id,product_name,product_id,product_variant_id,price,quantity,total_amount')
      .eq('order_id', id),
    client
      .from('order_shipping_addresses')
      .select('full_address,phone_number,state,city,zip_code')
      .eq('order_id', id)
      .maybeSingle(),
    client.from('users').select('id,full_name,phone_number').eq('id', order.user_id).maybeSingle(),
  ])
  return {
    ...order,
    items: unwrap(items) ?? [],
    shipping_address: unwrap(addresses),
    customer: unwrap(customer),
  }
}

export async function updateAdminOrder(id, values) {
  const client = await requireSupabase()
  if (!ORDER_STATUSES.includes(values.status)) throw new Error('Choose a valid order status.')
  const { error } = await client
    .from('orders')
    .update({ status: values.status, payment_status: values.payment_status.trim() })
    .eq('id', id)
  if (error) throw error
}

export async function getDashboardSummary() {
  const client = await requireSupabase()
  const { data, error } = await client.rpc('get_admin_dashboard_summary')
  if (error) throw error
  return data
}

export async function getStoreDeliverySettings() {
  const client = await requireSupabase()
  const { data, error } = await client.rpc('get_store_delivery_settings')
  if (error) throw error
  return data
}

export async function saveStoreDeliverySettings(settings) {
  const dhaka = Number(settings.dhaka_delivery_charge)
  const outside = Number(settings.outside_dhaka_delivery_charge)
  const cacheTtl = Number(settings.catalog_cache_ttl_seconds)
  if (!Number.isFinite(dhaka) || dhaka < 0 || !Number.isFinite(outside) || outside < 0) {
    throw new Error('Delivery charges must be zero or greater.')
  }
  if (!Number.isSafeInteger(cacheTtl) || cacheTtl < 1 || cacheTtl > 86400) {
    throw new Error('Catalog cache TTL must be between 1 and 86400 seconds.')
  }
  const client = await requireSupabase()
  const { data, error } = await client.rpc('update_store_delivery_settings', {
    p_dhaka_delivery_charge: dhaka,
    p_outside_dhaka_delivery_charge: outside,
    p_catalog_cache_ttl_seconds: cacheTtl,
  })
  if (error) throw error
  return data
}

export async function getHomepageContent() {
  const client = await requireSupabase()
  const { data, error } = await client.rpc('get_homepage_content')
  if (error) throw error
  return data
}

export async function saveHomepageContent(content) {
  const client = await requireSupabase()
  const { data, error } = await client.rpc('update_homepage_content', {
    p_content: content,
  })
  if (error) throw error
  return data
}