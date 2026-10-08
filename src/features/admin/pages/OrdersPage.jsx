import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import DataTable from '../components/DataTable'
import useAdminOrders from '../hooks/useAdminOrders'

const money = (value) => `৳${Number(value || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`

export default function OrdersPage() {
  const { orders, loading, error } = useAdminOrders()
  const columns = [
    { key: 'order_number', label: 'Order' },
    { key: 'customer', label: 'Customer', render: (order) => order.customer?.full_name || 'Customer' },
    { key: 'created_at', label: 'Date', render: (order) => new Date(order.created_at).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (order) => <span className={`admin-pill admin-pill--${order.status}`}>{order.status}</span> },
    { key: 'payment_method', label: 'Method', render: (order) => order.payment_method?.replace('_', ' ') || '—' },
    { key: 'payment_status', label: 'Payment', render: (order) => order.payment_status },
    { key: 'net_amount', label: 'Total', render: (order) => money(order.net_amount ?? order.total_amount) },
    { key: 'open', label: '', render: (order) => <Link className="admin-inline-link" to={`/admin/orders/${order.id}`}>Details <ArrowRight size={14} /></Link> },
  ]

  return (
    <div className="admin-page">
      <header className="admin-page__heading"><div><span className="eyebrow">Fulfil and track purchases</span><h1>Orders</h1></div><span className="admin-count">{orders.length} total</span></header>
      {error && <div className="notice notice--error" role="alert">{error}</div>}
      {loading ? <p className="admin-message">Loading orders…</p> : <DataTable columns={columns} rows={orders} emptyMessage="Orders will appear here once a customer checks out." />}
    </div>
  )
}