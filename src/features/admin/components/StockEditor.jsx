import { useState } from 'react'

export default function StockEditor({ value, onSave, saving = false }) {
  const [quantity, setQuantity] = useState(String(value))

  return (
    <form
      className="stock-editor"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(quantity)
      }}
    >
      <input
        type="number"
        min="0"
        step="1"
        value={quantity}
        onChange={(event) => setQuantity(event.target.value)}
        aria-label="Stock quantity"
        required
      />
      <button className="admin-button admin-button--small" type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}