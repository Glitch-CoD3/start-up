const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
]

export default function StatusSelect({
  value,
  onChange,
  disabled = false,
  disabledStatuses = [],
  label = 'Order status',
}) {
  return (
    <label className="admin-field admin-status-select">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {ORDER_STATUSES.map((orderStatus) => (
          <option
            value={orderStatus}
            key={orderStatus}
            disabled={disabledStatuses.includes(orderStatus)}
          >
            {orderStatus[0].toUpperCase() + orderStatus.slice(1)}
          </option>
        ))}
      </select>
    </label>
  )
}