export default function OrderStatusBadge({ status }) {
  const label = (status || 'processing').replaceAll('_', ' ')
  const modifier = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return <span className={`status-badge status-badge--${modifier}`}>{label}</span>
}