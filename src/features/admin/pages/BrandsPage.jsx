import { Pencil, Plus, Save, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '../components/DataTable'
import { getAdminBrands, getProductOptions, saveAdminBrand } from '../api'

const blankBrand = () => ({ brand_name: '', category_id: '', logo: '' })

export default function BrandsPage() {
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(blankBrand)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const editing = Boolean(form.id)

  const refresh = useCallback(async () => {
    setError('')
    try {
      const [nextBrands, options] = await Promise.all([getAdminBrands(), getProductOptions()])
      setBrands(nextBrands)
      setCategories(options.categories)
    } catch (cause) {
      console.error('Could not load brands.', cause)
      setError(cause.message || 'Brands could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([getAdminBrands(), getProductOptions()])
      .then(([data, options]) => {
        if (!active) return
        setBrands(data)
        setCategories(options.categories)
      })
      .catch((cause) => {
        console.error('Could not load brands.', cause)
        if (active) setError(cause.message || 'Brands could not be loaded.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await saveAdminBrand(form)
      toast.success(editing ? 'Brand updated.' : 'Brand created.')
      setForm(blankBrand())
      await refresh()
    } catch (cause) {
      console.error('Could not save brand.', cause)
      setError(cause.message || 'Brand could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'brand_name', label: 'Brand' },
    { key: 'category_name', label: 'Category', render: (brand) => brand.category_name || 'Assign a category' },
    { key: 'logo', label: 'Logo URL', render: (brand) => brand.logo || '—' },
    {
      key: 'actions',
      label: '',
      render: (brand) => (
        <button className="admin-icon-action" type="button" onClick={() => setForm({ ...brand, logo: brand.logo ?? '' })} aria-label={`Edit ${brand.brand_name}`}><Pencil size={15} /></button>
      ),
    },
  ]

  return (
    <div className="admin-page">
      <header className="admin-page__heading">
        <div><span className="eyebrow">Manage product labels</span><h1>Brands</h1></div>
        <button className="admin-button admin-button--light" type="button" onClick={() => setForm(blankBrand())}><Plus size={15} /> New brand</button>
      </header>
      {error && <div className="notice notice--error" role="alert">{error}</div>}
      <form className="admin-form-card admin-taxonomy-form" onSubmit={submit}>
        <div className="admin-section__heading">
          <div><span className="eyebrow">{editing ? 'Update an existing label' : 'Add a new label'}</span><h2>{editing ? 'Edit brand' : 'New brand'}</h2></div>
          {editing && <button className="admin-icon-action" type="button" onClick={() => setForm(blankBrand())} aria-label="Cancel editing"><X size={17} /></button>}
        </div>
        <div className="admin-form-grid">
          <label className="admin-field"><span>Brand name</span><input required maxLength="100" value={form.brand_name} onChange={(event) => setForm((current) => ({ ...current, brand_name: event.target.value }))} /></label>
          <label className="admin-field"><span>Category</span><select required value={form.category_id ?? ''} onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}><option value="">Choose category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.category_name}</option>)}</select></label>
          <label className="admin-field"><span>Logo URL <small>Optional</small></span><input type="url" maxLength="255" value={form.logo} onChange={(event) => setForm((current) => ({ ...current, logo: event.target.value }))} /></label>
        </div>
        <div className="admin-taxonomy-form__actions"><button className="admin-button" type="submit" disabled={saving}><Save size={15} /> {saving ? 'Saving…' : editing ? 'Save brand' : 'Create brand'}</button></div>
      </form>
      <section className="admin-section">
        <div className="admin-section__heading"><div><span className="eyebrow">Available for products</span><h2>All brands</h2></div></div>
        {loading ? <p className="admin-message">Loading brands…</p> : <DataTable columns={columns} rows={brands} emptyMessage="No brands yet. Create one above." />}
      </section>
    </div>
  )
}
