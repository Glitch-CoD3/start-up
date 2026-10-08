import { useCallback, useEffect, useState } from 'react'
import { deleteUserAddress, getUserAddresses, saveUserAddress } from '../api'
import { useAuth } from '../../../app/providers'

export default function useAddresses() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(Boolean(user))
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      setAddresses(await getUserAddresses(user.id))
    } catch (cause) {
      console.error('Could not load saved addresses.', cause)
      setError(cause.message || 'Your saved addresses could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return undefined
    let active = true
    getUserAddresses(user.id)
      .then((data) => {
        if (active) {
          setAddresses(data)
          setError('')
        }
      })
      .catch((cause) => {
        console.error('Could not load saved addresses.', cause)
        if (active) setError(cause.message || 'Your saved addresses could not be loaded.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user])

  const save = useCallback(
    async (address) => {
      const saved = await saveUserAddress(user.id, address)
      await refresh()
      return saved
    },
    [refresh, user],
  )

  const remove = useCallback(
    async (addressId) => {
      await deleteUserAddress(user.id, addressId)
      await refresh()
    },
    [refresh, user],
  )

  return { addresses, loading, error, save, remove, refresh }
}