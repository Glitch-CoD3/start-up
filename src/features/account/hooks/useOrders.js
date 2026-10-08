import { useEffect, useState } from 'react'
import { getUserOrders } from '../api'
import { useAuth } from '../../../app/providers'

export default function useOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(Boolean(user))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return undefined

    let active = true
    getUserOrders(user.id)
      .then((data) => {
        if (active) {
          setOrders(data)
          setError('')
        }
      })
      .catch((cause) => {
        console.error('Could not load your order history.', cause)
        if (active) setError(cause.message || 'Your orders could not be loaded.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user])

  return { orders, loading, error }
}