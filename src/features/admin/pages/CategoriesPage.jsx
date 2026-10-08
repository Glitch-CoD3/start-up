import { Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '../components/DataTable'
import { getAdminCategories, saveAdminCategory, setAdminCategoryStatus } from '../api'

const blankCategory = () => ({
  category_name: '',
  url_slug: '',
  parent_category_id: '',
  status: 'active',
})

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(blankCategory)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const editing = Boolean(form.id)

  const refresh = useCallback(async () => {
    setError('')
    try {
      setCategories(await getAdminCategories())
    } catch (cause) {
      console.error('Could not load categories.', cause)
      setError(cause.message || 'Categories could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    getAdminCategories()
      .then((data) => {
        if (active) setCategories(data)
      })
      .catch((cause) => {
        console.error('Could not load categories.', cause)
        if (active) setError(cause.message || 'Categories could not be loaded.')
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
      await saveAdminCategory(form)
      toast.success(editing ? 'Category updated.' : 'Category created.')
      setForm(blankCategory())
      await refresh()
    } catch (cause) {
      console.error('Could not save category.', cause)
      setError(cause.message || 'Category could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const archive = async (category) => {
    if (!window.confirm(`Archive "${category.category_name}"? Existing products will keep their category.`)) return
    try {
      await setAdminCategoryStatus(category.id, 'deleted')
      toast.success('Category archived.')
      if (form.id === category.id) setForm(blankCategory())
      await refresh()
    } catch (cause) {
      toast.error(cause.message || 'Could not archive category.')
    }
  }

  const columns = [
    { key: 'category_name', label: 'Category' },
    { key: 'url_slug', label: 'URL slug' },
    { key: 'parent_name', label: 'Parent', render: (category) => category.parent_name || '—' },
    { key: 'status', label: 'Status', render: (category) => <span className={`admin-pill admin-pill--${category.status}`}>{category.status}</span> },
    {
      key: 'actions',
      label: '',
      render: (category) => (
        <div className="admin-row-actions">
          <button className="admin-icon-action" type="button" onClick={() => setForm({ ...category, parent_category_id: category.parent_category_id ?? '' })} aria-label={`Edit ${category.category_name}`}><Pencil size={15} /></button>
          <button className="admin-icon-action" type="button" onClick={() => archive(category)} aria-label={`Archive ${category.category_name}`}><Trash2 size={15} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="admin-page">
      <header className="admin-page__heading">
        <div><span className="eyebrow">Organize the catalog</span><h1>Categories</h1></div>
        <button className="admin-button admin-button--light" type="button" onClick={() => setForm(blankCategory())}><Plus size={15} /> New category</button>
      </header>
      {error && <div className="notice notice--error" role="alert">{error}</div>}
      <form className="admin-form-card admin-taxonomy-form" onSubmit={submit}>
        <div className="admin-section__heading">
          <div><span className="eyebrow">{editing ? 'Update an existing group' : 'Add a new group'}</span><h2>{editing ? 'Edit category' : 'New category'}</h2></div>
          {editing && <button className="admin-icon-action" type="button" onClick={() => setForm(blankCategory())} aria-label="Cancel editing"><X size={17} /></button>}
        </div>
        <div className="admin-form-grid">
          <label className="admin-field"><span>Category name</span><input required maxLength="150" value={form.category_name} onChange={(event) => { const name = event.target.value; setForm((current) => ({ ...current, category_name: name, url_slug: !current.id || current.url_slug === slugify(current.category_name) ? slugify(name) : current.url_slug })) }} /></label>
          <label className="admin-field"><span>URL slug</span><input required maxLength="180" value={form.url_slug} onChange={(event) => setForm((current) => ({ ...current, url_slug: slugify(event.target.value) }))} /></label>
          <label className="admin-field"><span>Parent category <small>Optional</small></span><select value={form.parent_category_id} onChange={(event) => setForm((current) => ({ ...current, parent_category_id: event.target.value }))}><option value="">No parent</option>{categories.filter((category) => category.id !== form.id).map((category) => <option key={category.id} value={category.id}>{category.category_name}</option>)}</select></label>
          <label className="admin-field"><span>Status</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        </div>
        <div className="admin-taxonomy-form__actions"><button className="admin-button" type="submit" disabled={saving}><Save size={15} /> {saving ? 'Saving…' : editing ? 'Save category' : 'Create category'}</button></div>
      </form>
      <section className="admin-section">
        <div className="admin-section__heading"><div><span className="eyebrow">Catalog structure</span><h2>All categories</h2></div></div>
        {loading ? <p className="admin-message">Loading categories…</p> : <DataTable columns={columns} rows={categories} emptyMessage="No categories yet. Create one above." />}
      </section>
    </div>
  )
}
