import { useCallback, useState } from 'react'
import { updateVariantStock } from '../api'

export default function useStockUpdate() {
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')

  const saveStock = useCallback(async (inventoryItem, quantity) => {
    setSavingId(inventoryItem.id)
    setError('')
    try {
      await updateVariantStock(inventoryItem, quantity)
      return true
    } catch (cause) {
      console.error('Could not update inventory stock.', cause)
      setError(cause.message || 'Stock could not be updated.')
      return false
    } finally {
      setSavingId(null)
    }
  }, [])

  return { saveStock, savingId, error }
}