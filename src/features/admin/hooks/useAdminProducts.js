import { useCallback, useEffect, useState } from 'react'
import { deleteAdminProduct, getAdminProducts } from '../api'

export default function useAdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setProducts(await getAdminProducts())
    } catch (cause) {
      console.error('Could not load admin products.', cause)
      setError(cause.message || 'Products could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    getAdminProducts()
      .then((data) => {
        if (active) setProducts(data)
      })
      .catch((cause) => {
        console.error('Could not load admin products.', cause)
        if (active) setError(cause.message || 'Products could not be loaded.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const remove = useCallback(async (id) => {
    const result = await deleteAdminProduct(id)
    await refresh()
    return result
  }, [refresh])

  return { products, loading, error, refresh, remove }
}