import { ArrowRight, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import DataTable from '../components/DataTable'
import useAdminProducts from '../hooks/useAdminProducts'

export default function ProductsPage() {
  const { products, loading, error, remove } = useAdminProducts()
  const handleDelete = async (product) => {
    if (!window.confirm(`Remove "${product.product_name}" from the catalog?`)) return
    try {
      const { cleanupWarning } = await remove(product.id)
      toast.success('Product archived.')
      if (cleanupWarning) toast.error(`Product archived, but image cleanup failed: ${cleanupWarning}`)
    } catch (cause) {
      toast.error(cause.message || 'Could not remove product.')
    }
  }
  const columns = [
    { key: 'product_name', label: 'Product', render: (product) => <div><strong>{product.product_name}</strong><small className="admin-cell-subtitle">{product.url_slug}</small></div> },
    { key: 'category_name', label: 'Category' },
    { key: 'price', label: 'Price', render: (product) => `৳${Number(product.price).toLocaleString('en-BD')}` },
    { key: 'discount_type', label: 'Discount', render: (product) => product.discount_type === 'fixed' ? `৳${product.discount_value}` : product.discount_type === 'percentage' ? `${product.discount_value}%` : '—' },
    { key: 'stock_quantity', label: 'Stock' },
    { key: 'status', label: 'Status', render: (product) => <span className={`admin-pill admin-pill--${product.status}`}>{product.status}</span> },
    { key: 'actions', label: '', render: (product) => <div className="admin-row-actions"><Link className="admin-inline-link" to={`/admin/products/${product.id}/edit`}>Edit <ArrowRight size={14} /></Link><button className="admin-icon-action" type="button" onClick={() => handleDelete(product)} aria-label={`Remove ${product.product_name}`}><Trash2 size={15} /></button></div> },
  ]

  return (
    <div className="admin-page">
      <header className="admin-page__heading">
        <div><span className="eyebrow">Manage the catalog</span><h1>Products</h1></div>
        <Link className="admin-button" to="/admin/products/new"><Plus size={16} /> Add product</Link>
      </header>
      {error && <div className="notice notice--error" role="alert">{error}</div>}
      {loading ? <p className="admin-message">Loading products…</p> : (
        <DataTable columns={columns} rows={products} emptyMessage="No products yet. Add the first one to your catalog." />
      )}
    </div>
  )
}