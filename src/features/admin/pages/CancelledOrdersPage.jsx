import { useEffect, useState } from 'react'
import { getAdminCancelledOrders } from '../api'
import DataTable from '../components/DataTable'

const money = (value) => `৳${Number(value || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '—'
}

export default function CancelledOrdersPage() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getAdminCancelledOrders(page * 50)
      .then((data) => {
        if (active) {
          setOrders(data.orders)
          setTotal(data.total)
        }
      })
      .catch((cause) => {
        console.error('Could not load cancelled orders.', cause)
        if (active) setError(cause.message || 'Cancelled orders could not be loaded.')
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [page])

  const goToPage = (nextPage) => {
    setLoading(true)
    setError('')
    setPage(nextPage)
  }

  const columns = [
    { key: 'order_number', label: 'Order' },
    { key: 'customer', label: 'Customer', render: (order) => order.customer?.full_name || order.customer?.phone_number || 'Customer' },
    { key: 'cancelled_at', label: 'Cancelled', render: (order) => formatDate(order.cancelled_at) },
    {
      key: 'items',
      label: 'Items',
      render: (order) => order.items.length
        ? order.items.map((item) => `${item.product_name} × ${item.quantity}`).join(', ')
        : 'No item details',
    },
    { key: 'payment_status', label: 'Payment', render: (order) => order.payment_status || 'UNPAID' },
    { key: 'net_amount', label: 'Total', render: (order) => money(order.net_amount ?? order.total_amount) },
    {
      key: 'archived_at',
      label: 'Record',
      render: (order) => order.archived_at
        ? `Archived ${formatDate(order.archived_at)}`
        : 'Active cancellation',
    },
  ]

  return (
    <div className="admin-page">
      <header className="admin-page__heading">
        <div>
          <span className="eyebrow">Cancelled orders and retained analysis history</span>
          <h1>Cancelled orders</h1>
        </div>
        {!loading && <span className="admin-count">{total} total</span>}
      </header>
      <p className="admin-message">
        Cancelled orders stay here after being removed from active orders. Full order, item, and shipping details are retained in the archive after 7 days.
      </p>
      {error && <div className="notice notice--error" role="alert">{error}</div>}
      {loading
        ? <p className="admin-message">Loading cancelled orders…</p>
        : <DataTable columns={columns} rows={orders} emptyMessage="There are no cancelled orders." />}
      {!loading && total > 50 && (
        <div className="admin-page__heading">
          <span className="admin-message">Page {page + 1} of {Math.ceil(total / 50)}</span>
          <div>
            <button className="admin-button admin-button--light" type="button" onClick={() => goToPage(page - 1)} disabled={page === 0}>Previous</button>
            {' '}
            <button className="admin-button admin-button--light" type="button" onClick={() => goToPage(page + 1)} disabled={(page + 1) * 50 >= total}>Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
