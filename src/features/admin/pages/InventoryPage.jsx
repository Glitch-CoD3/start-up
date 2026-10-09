import { useCallback, useEffect, useState } from 'react'
import { getInventory, LOW_STOCK_THRESHOLD } from '../api'
import DataTable from '../components/DataTable'
import StockEditor from '../components/StockEditor'
import useStockUpdate from '../hooks/useStockUpdate'

export default function InventoryPage() {
  const [inventory, setInventory] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { saveStock, savingId, error: saveError } = useStockUpdate()
  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setInventory(await getInventory())
    } catch (cause) {
      console.error('Could not load inventory.', cause)
      setError(cause.message || 'Inventory could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    getInventory()
      .then((data) => {
        if (active) setInventory(data)
      })
      .catch((cause) => {
        console.error('Could not load inventory.', cause)
        if (active) setError(cause.message || 'Inventory could not be loaded.')
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const columns = [
    { key: 'product_name', label: 'Product' },
    { key: 'colors', label: 'Color', render: (variant) => variant.colors || (variant.is_product_stock ? 'Base stock' : '—') },
    { key: 'sizes', label: 'Size', render: (variant) => variant.sizes || '—' },
    { key: 'stock_quantity', label: 'On hand', render: (variant) => <StockEditor key={`${variant.id}-${variant.stock_quantity}`} value={variant.stock_quantity} saving={savingId === variant.id} onSave={async (quantity) => { if (await saveStock(variant, quantity)) await refresh() }} /> },
    { key: 'reserved_quantity', label: 'Reserved' },
    { key: 'available_quantity', label: 'Available' },
  ]
  const categoryProducts = new Map()
  for (const item of inventory) {
    const category = categoryProducts.get(item.category_id) ?? {
      name: item.category_name,
      productIds: new Set(),
    }
    category.productIds.add(item.product_id)
    categoryProducts.set(item.category_id, category)
  }
  const categories = [...categoryProducts]
    .map(([id, category]) => ({
      id,
      name: category.name,
      productCount: category.productIds.size,
    }))
    .sort((first, second) => first.name.localeCompare(second.name))
  const filteredInventory = selectedCategoryId
    ? inventory.filter((item) => item.category_id === selectedCategoryId)
    : inventory
  const selectedProductCount = new Set(filteredInventory.map((item) => item.product_id)).size
  const lowStockItems = filteredInventory.filter(
    (item) => item.available_quantity < LOW_STOCK_THRESHOLD,
  )

  return (
    <div className="admin-page">
      <header className="admin-page__heading">
        <div>
          <span className="eyebrow">Availability by product variant</span>
          <h1>Inventory</h1>
        </div>
        {!loading && <span className="inventory-category-total">{selectedProductCount} products</span>}
      </header>
      {(error || saveError) && <div className="notice notice--error" role="alert">{error || saveError}</div>}
      {!loading && lowStockItems.length > 0 && (
        <div className="notice notice--warning" role="alert">
          <strong>{lowStockItems.length} {lowStockItems.length === 1 ? 'item is' : 'items are'} low in stock.</strong>
          {' '}Available quantity is below {LOW_STOCK_THRESHOLD} after pending order reservations.
          <ul>
            {lowStockItems.slice(0, 5).map((item) => (
              <li key={item.id}>
                {item.product_name}{item.colors ? ` · ${item.colors}` : ''}{item.sizes ? ` · ${item.sizes}` : ''}
                {' — '}{item.available_quantity} available
              </li>
            ))}
          </ul>
          {lowStockItems.length > 5 && <span>And {lowStockItems.length - 5} more.</span>}
        </div>
      )}
      {loading ? <p className="admin-message">Loading inventory…</p> : (
        <>
          <nav className="inventory-category-bar" aria-label="Filter inventory by category">
            <button
              className={`inventory-category-tab${selectedCategoryId === '' ? ' is-active' : ''}`}
              type="button"
              aria-pressed={selectedCategoryId === ''}
              onClick={() => setSelectedCategoryId('')}
            >
              All <span>{new Set(inventory.map((item) => item.product_id)).size}</span>
            </button>
            {categories.map((category) => (
              <button
                className={`inventory-category-tab${selectedCategoryId === category.id ? ' is-active' : ''}`}
                key={category.id}
                type="button"
                aria-pressed={selectedCategoryId === category.id}
                onClick={() => setSelectedCategoryId(category.id)}
              >
                {category.name} <span>{category.productCount}</span>
              </button>
            ))}
          </nav>
          <DataTable
            columns={columns}
            rows={filteredInventory}
            emptyMessage={selectedCategoryId ? 'There are no products in this category.' : 'There are no active product variants to manage.'}
          />
        </>
      )}
    </div>
  )
}