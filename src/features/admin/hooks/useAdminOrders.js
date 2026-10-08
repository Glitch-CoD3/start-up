import { useCallback, useEffect, useState } from 'react'
import { getAdminOrders } from '../api'

export default function useAdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setOrders(await getAdminOrders())
    } catch (cause) {
      console.error('Could not load admin orders.', cause)
      setError(cause.message || 'Orders could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    getAdminOrders()
      .then((data) => {
        if (active) setOrders(data)
      })
      .catch((cause) => {
        console.error('Could not load admin orders.', cause)
        if (active) setError(cause.message || 'Orders could not be loaded.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  return { orders, loading, error, refresh }
}