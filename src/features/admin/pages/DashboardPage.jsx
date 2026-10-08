import { ArrowRight, Boxes, CircleDollarSign, Package, ShoppingBag, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../app/providers'
import { getDashboardSummary } from '../api'
import DataTable from '../components/DataTable'

const DASHBOARD_CACHE_KEY = 'trendlama-admin-dashboard'
const DASHBOARD_CACHE_TTL = 60_000
const dashboardRequests = new Map()

const money = (value) => `৳${Number(value || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
const date = (value) => new Date(value).toLocaleDateString()

function readCachedSummary(userId) {
  try {
    const cached = window.sessionStorage.getItem(`${DASHBOARD_CACHE_KEY}:${userId}`)
    if (!cached) return null
    const { summary, cachedAt } = JSON.parse(cached)
    return summary ? { summary, cachedAt: Number(cachedAt) || 0 } : null
  } catch (cause) {
    console.error('Could not read the cached admin dashboard.', cause)
    return null
  }
}

function loadDashboardSummary(userId) {
  const existingRequest = dashboardRequests.get(userId)
  if (existingRequest) return existingRequest

  const request = getDashboardSummary()
    .then((summary) => {
      try {
        window.sessionStorage.setItem(
          `${DASHBOARD_CACHE_KEY}:${userId}`,
          JSON.stringify({ summary, cachedAt: Date.now() }),
        )
      } catch (cause) {
        console.error('Could not cache the admin dashboard.', cause)
      }
      return summary
    })
    .finally(() => dashboardRequests.delete(userId))

  dashboardRequests.set(userId, request)
  return request
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [initialCache] = useState(() => readCachedSummary(user.id))
  const [summary, setSummary] = useState(() => initialCache?.summary ?? null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(() => !initialCache?.summary)

  useEffect(() => {
    if (initialCache?.cachedAt && Date.now() - initialCache.cachedAt < DASHBOARD_CACHE_TTL) {
      return undefined
    }
    let active = true
    loadDashboardSummary(user.id)
      .then((data) => {
        if (!active) return
        setSummary(data)
        setError('')
      })
      .catch((cause) => {
        console.error('Could not load the admin dashboard.', cause)
        if (active) setError(cause.message || 'Dashboard information could not be loaded.')
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [initialCache, user.id])

  const cards = summary ? [
    { label: 'Products', value: summary.productCount, icon: Package },
    { label: 'Orders', value: summary.orderCount, icon: ShoppingBag },
    { label: 'Customers', value: summary.customerCount, icon: Users },
    { label: 'Revenue', value: money(summary.revenue), icon: CircleDollarSign },
  ] : []
  const columns = [
    { key: 'order_number', label: 'Order' },
    { key: 'created_at', label: 'Date', render: (order) => date(order.created_at) },
    { key: 'status', label: 'Status', render: (order) => <span className={`admin-pill admin-pill--${order.status}`}>{order.status}</span> },
    { key: 'net_amount', label: 'Amount', render: (order) => money(order.net_amount ?? order.total_amount) },
    { key: 'open', label: '', render: (order) => <Link className="admin-inline-link" to={`/admin/orders/${order.id}`}>View <ArrowRight size={14} /></Link> },
  ]

  return (
    <div className="admin-page">
      <header className="admin-page__heading">
        <div><span className="eyebrow">Your store, at a glance</span><h1>Overview</h1></div>
        <Link className="admin-button admin-button--light" to="/admin/inventory"><Boxes size={16} /> Manage inventory</Link>
      </header>
      {error && <div className="notice notice--error" role="alert">{error}</div>}
      {loading ? <p className="admin-message">Loading store overview…</p> : summary && (
        <>
          <section className="admin-stat-grid" aria-label="Store statistics">
            {cards.map(({ label, value, icon: Icon }) => (
              <article className="admin-stat-card" key={label}>
                <span className="admin-stat-card__icon"><Icon size={18} /></span>
                <span className="eyebrow">{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </section>
          <section className="admin-section">
            <div className="admin-section__heading">
              <div><span className="eyebrow">Latest activity</span><h2>Recent orders</h2></div>
              <Link className="admin-inline-link" to="/admin/orders">All orders <ArrowRight size={14} /></Link>
            </div>
            <DataTable columns={columns} rows={summary.recentOrders} emptyMessage="No orders have been placed yet." />
          </section>
        </>
      )}
    </div>
  )
}