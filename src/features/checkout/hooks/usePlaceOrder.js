import { useState } from 'react'
import { placeCustomerOrder } from '../api'

export default function usePlaceOrder() {
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  const submitOrder = async (details) => {
    setPlacing(true)
    setError('')
    try {
      return await placeCustomerOrder(details)
    } catch (cause) {
      console.error('Could not place customer order.', cause)
      setError(cause.message || 'Your order could not be placed.')
      return null
    } finally {
      setPlacing(false)
    }
  }

  return { submitOrder, placing, error }
}