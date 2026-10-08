import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import ImageUploader from '../components/ImageUploader'
import { getAdminProduct, getProductOptions, saveAdminProduct } from '../api'
import { deleteUnusedProductImages } from '../storage'

const newVariant = () => ({ colors: '', sizes: '', price: '', stock_quantity: 0, images: [] })
const blankProduct = () => ({
  product_name: '',
  url_slug: '',
  category_id: '',
  brand_id: '',
  price: '',
  discount_type: 'none',
  discount_value: '0',
  short_description: '',
  description: '',
  status: 'active',
  variants: [newVariant()],
})

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function ProductEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)
  const [product, setProduct] = useState(blankProduct)
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getProductOptions(), editing ? getAdminProduct(id) : Promise.resolve(null)])
      .then(([options, savedProduct]) => {
        if (!active) return
        setCategories(options.categories)
        setBrands(options.brands)
        if (editing && !savedProduct) {
          setError('This product could not be found.')
          return
        }
        if (savedProduct) {
          setProduct({
            ...savedProduct,
            price: String(savedProduct.price),
            variants: savedProduct.variants.map((variant) => ({
              ...variant,
              price: String(variant.price),
              images: variant.images ?? [],
            })),
          })
        } else if (options.categories.length) {
          setProduct((current) => ({ ...current, category_id: options.categories[0].id }))
        }
      })
      .catch((cause) => {
        console.error('Could not load product editor data.', cause)
        if (active) setError(cause.message || 'Product information could not be loaded.')
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [editing, id])

  const updateField = (field, value) => setProduct((current) => ({ ...current, [field]: value }))
  const updateCategory = (categoryId) => setProduct((current) => ({
    ...current,
    category_id: categoryId,
    brand_id: brands.some((brand) => brand.id === current.brand_id && brand.category_id === categoryId)
      ? current.brand_id
      : '',
  }))
  const updateVariant = (index, field, value) => {
    setProduct((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant,
      ),
    }))
  }
  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const { removedImageUrls } = await saveAdminProduct(product)
      toast.success(editing ? 'Product updated.' : 'Product created.')
      navigate('/admin/products')
      try {
        await deleteUnusedProductImages(removedImageUrls)
      } catch (cleanupError) {
        console.error('Product was saved, but old images could not be deleted.', cleanupError)
        toast.error(`Product saved, but old image cleanup failed: ${cleanupError.message}`)
      }
    } catch (cause) {
      console.error('Could not save product.', cause)
      setError(cause.message || 'Product could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-page"><p className="admin-message">Loading product…</p></div>

  return (
    <div className="admin-page">
      <header className="admin-page__heading">
        <div>
          <Link className="admin-back-link admin-back-link--inline" to="/admin/products"><ArrowLeft size={15} /> All products</Link>
          <span className="eyebrow">{editing ? 'Update catalog details' : 'Create a catalog listing'}</span>
          <h1>{editing ? 'Edit product' : 'New product'}</h1>
        </div>
        <button className="admin-button" type="submit" form="admin-product-form" disabled={saving}>
          <Save size={16} /> {saving ? 'Saving…' : 'Save product'}
        </button>
      </header>
      {error && <div className="notice notice--error" role="alert">{error}</div>}
      <form className="admin-form" id="admin-product-form" onSubmit={submit}>
        <section className="admin-form-card">
          <div className="admin-section__heading"><div><span className="eyebrow">Catalog listing</span><h2>Product details</h2></div></div>
          <div className="admin-form-grid">
            <label className="admin-field admin-field--wide"><span>Product name</span><input required maxLength="255" value={product.product_name} onChange={(event) => { const name = event.target.value; updateField('product_name', name); if (!editing || product.url_slug === slugify(product.product_name)) updateField('url_slug', slugify(name)) }} /></label>
            <label className="admin-field"><span>URL slug</span><input required maxLength="255" value={product.url_slug} onChange={(event) => updateField('url_slug', slugify(event.target.value))} /></label>
            <label className="admin-field"><span>Category</span><select required value={product.category_id} onChange={(event) => updateCategory(event.target.value)}><option value="">Choose category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.category_name}</option>)}</select></label>
            <label className="admin-field"><span>Brand <small>Optional · for {categories.find((category) => category.id === product.category_id)?.category_name || 'selected category'}</small></span><select value={product.brand_id ?? ''} onChange={(event) => updateField('brand_id', event.target.value)} disabled={!product.category_id}><option value="">No brand</option>{brands.filter((brand) => brand.category_id === product.category_id).map((brand) => <option key={brand.id} value={brand.id}>{brand.brand_name}</option>)}</select></label>
            <label className="admin-field"><span>Base price (৳)</span><input type="number" min="0" step="0.01" required value={product.price} onChange={(event) => updateField('price', event.target.value)} /></label>
            <label className="admin-field"><span>Discount type</span><select value={product.discount_type ?? 'none'} onChange={(event) => updateField('discount_type', event.target.value)}><option value="none">No discount</option><option value="fixed">Fixed amount (৳)</option><option value="percentage">Percentage (%)</option></select></label>
            {product.discount_type !== 'none' && <label className="admin-field"><span>{product.discount_type === 'fixed' ? 'Discount amount (৳)' : 'Discount percentage (%)'}</span><input type="number" min="0" max={product.discount_type === 'percentage' ? '100' : undefined} step="0.01" required value={product.discount_value ?? '0'} onChange={(event) => updateField('discount_value', event.target.value)} /></label>}
            <label className="admin-field"><span>Status</span><select value={product.status} onChange={(event) => updateField('status', event.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="discontinued">Discontinued</option></select></label>
            <label className="admin-field admin-field--wide"><span>Short description</span><textarea maxLength="1000" rows="2" value={product.short_description ?? ''} onChange={(event) => updateField('short_description', event.target.value)} /></label>
            <label className="admin-field admin-field--wide"><span>Description</span><textarea rows="5" value={product.description ?? ''} onChange={(event) => updateField('description', event.target.value)} /></label>
          </div>
        </section>
        <section className="admin-form-card">
          <div className="admin-section__heading">
            <div><span className="eyebrow">Sizes, colors and stock</span><h2>Product variants</h2></div>
            <button className="admin-button admin-button--light" type="button" onClick={() => updateField('variants', [...product.variants, newVariant()])}><Plus size={15} /> Add variant</button>
          </div>
          {product.variants.map((variant, index) => (
            <fieldset className="admin-variant" key={variant.id ?? `new-${index}`}>
              <legend>Variant {index + 1}</legend>
              <button className="admin-icon-action admin-variant__remove" type="button" onClick={() => updateField('variants', product.variants.filter((_, variantIndex) => variantIndex !== index))} aria-label={`Remove variant ${index + 1}`}><Trash2 size={15} /></button>
              <div className="admin-form-grid">
                <label className="admin-field"><span>Color</span><input maxLength="100" value={variant.colors ?? ''} onChange={(event) => updateVariant(index, 'colors', event.target.value)} placeholder="e.g. Olive" /></label>
                <label className="admin-field"><span>Size</span><select value={variant.sizes ?? ''} onChange={(event) => updateVariant(index, 'sizes', event.target.value)}><option value="">No size</option>{['M', 'L', 'XL', 'XXL', '3XL'].map((size) => <option key={size} value={size}>{size}</option>)}</select></label>
                <label className="admin-field"><span>Variant price (৳)</span><input type="number" min="0" step="0.01" required value={variant.price} onChange={(event) => updateVariant(index, 'price', event.target.value)} /></label>
                <label className="admin-field"><span>Stock quantity</span><input type="number" min="0" step="1" required value={variant.stock_quantity} onChange={(event) => updateVariant(index, 'stock_quantity', Number(event.target.value))} /></label>
                <div className="admin-field admin-field--wide"><span>Images</span><ImageUploader images={variant.images} onChange={(images) => updateVariant(index, 'images', images)} /></div>
              </div>
            </fieldset>
          ))}
          {!product.variants.length && <p className="admin-message">No variants. The product will use the base stock quantity, currently zero.</p>}
        </section>
      </form>
    </div>
  )
}