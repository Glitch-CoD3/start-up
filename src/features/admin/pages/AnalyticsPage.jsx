import { useEffect, useState } from 'react'
import { Ban, CheckCircle, CircleDollarSign, RotateCcw, ShoppingBag, Users } from 'lucide-react'
import { getAdminAnalytics } from '../api'
import DataTable from '../components/DataTable'

const money = (value) => `৳${Number(value || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
const number = (value) => Number(value || 0).toLocaleString('en-BD')

function localDateValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function defaultDateRange() {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 29)
  return { startDate: localDateValue(start), endDate: localDateValue(end) }
}

export default function AnalyticsPage() {
  const [range, setRange] = useState(defaultDateRange)
  const [appliedRange, setAppliedRange] = useState(defaultDateRange)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rangeError, setRangeError] = useState('')

  useEffect(() => {
    let active = true
    getAdminAnalytics(appliedRange.startDate, appliedRange.endDate)
      .then((data) => {
        if (active) {
          setAnalytics(data)
          setError('')
        }
      })
      .catch((cause) => {
        console.error('Could not load admin analytics.', cause)
        if (active) setError(cause.message || 'Analytics could not be loaded.')
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [appliedRange])

  const applyRange = (event) => {
    event.preventDefault()
    if (range.startDate > range.endDate) {
      setRangeError('The start date must be before or equal to the end date.')
      return
    }
    setRangeError('')
    setError('')
    setLoading(true)
    setAnalytics(null)
    setAppliedRange({ ...range })
  }

  const cards = analytics ? [
    { label: 'Total orders', value: number(analytics.total_orders), icon: ShoppingBag },
    { label: 'Confirmed orders', value: number(analytics.confirmed_orders), icon: CheckCircle },
    { label: 'Cancelled orders', value: number(analytics.cancelled_orders), icon: Ban },
    { label: 'Refunded orders', value: number(analytics.refunded_orders), icon: RotateCcw },
    { label: 'Repeat customers', value: number(analytics.repeat_customer_count), icon: Users },
    { label: 'Paid revenue', value: money(analytics.revenue), icon: CircleDollarSign },
  ] : []
  const productColumns = [
    { key: 'product_name', label: 'Product' },
    { key: 'units_sold', label: 'Units sold', render: (product) => number(product.units_sold) },
    { key: 'order_count', label: 'Orders', render: (product) => number(product.order_count) },
    { key: 'revenue', label: 'Revenue', render: (product) => money(product.revenue) },
  ]
  const customerColumns = [
    { key: 'full_name', label: 'Customer', render: (customer) => customer.full_name || 'Customer' },
    { key: 'phone_number', label: 'Phone', render: (customer) => customer.phone_number || '—' },
    { key: 'order_count', label: 'Paid orders', render: (customer) => number(customer.order_count) },
    { key: 'total_spent', label: 'Total spent', render: (customer) => money(customer.total_spent) },
  ]

  return (
    <div className="admin-page">
      <header className="admin-page__heading">
        <div>
          <span className="eyebrow">Sales and order performance</span>
          <h1>Analytics</h1>
        </div>
      </header>

      <form className="admin-filter-form" onSubmit={applyRange}>
        <label className="admin-field">
          <span>From</span>
          <input
            type="date"
            required
            value={range.startDate}
            max={range.endDate}
            onChange={(event) => setRange((current) => ({ ...current, startDate: event.target.value }))}
          />
        </label>
        <label className="admin-field">
          <span>To</span>
          <input
            type="date"
            required
            value={range.endDate}
            min={range.startDate}
            onChange={(event) => setRange((current) => ({ ...current, endDate: event.target.value }))}
          />
        </label>
        <button className="admin-button" type="submit" disabled={loading}>Apply dates</button>
      </form>
      {rangeError && <div className="notice notice--error" role="alert">{rangeError}</div>}
      {error && <div className="notice notice--error" role="alert">{error}</div>}
      {loading && <p className="admin-message">Loading analytics…</p>}
      {!loading && analytics && (
        <>
          <p className="admin-message">
            Order totals, repeat customers, product sales, and revenue use order dates. Cancelled orders use the date each order was cancelled. Product sales and revenue include paid, non-cancelled orders only.
          </p>
          <section className="admin-stat-grid" aria-label="Order analytics">
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
              <div><span className="eyebrow">Paid, non-cancelled orders</span><h2>Top selling products</h2></div>
            </div>
            <DataTable
              columns={productColumns}
              rows={analytics.top_products ?? []}
              rowKey="product_name"
              emptyMessage="There are no paid product sales in this date range."
            />
          </section>
          <section className="admin-section">
            <div className="admin-section__heading">
              <div><span className="eyebrow">Customers with 2 or more paid orders</span><h2>Repeat customers</h2></div>
            </div>
            <DataTable
              columns={customerColumns}
              rows={analytics.repeat_customers ?? []}
              rowKey="user_id"
              emptyMessage="There are no repeat customers in this date range."
            />
          </section>
        </>
      )}
    </div>
  )
}
