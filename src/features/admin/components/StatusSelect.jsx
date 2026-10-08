const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
]

export default function StatusSelect({ value, onChange, disabled = false, label = 'Order status' }) {
  return (
    <label className="admin-field admin-status-select">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {ORDER_STATUSES.map((status) => (
          <option value={status} key={status}>{status[0].toUpperCase() + status.slice(1)}</option>
        ))}
      </select>
    </label>
  )
}