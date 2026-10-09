/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCatalog } from '../features/catalog/api'
import { DEFAULT_HOMEPAGE_CONTENT } from '../features/catalog/homepageContent'
import { isExpiredSessionError, isSupabaseConfigured, onSessionExpired, requireSupabase } from '../lib/supabase'

const CatalogContext = createContext(null)
const AuthContext = createContext(null)
const CartContext = createContext(null)
const GUEST_CART_KEY = 'trendlama-guest-cart'

function readGuestCart() {
  try {
    const stored = window.localStorage.getItem(GUEST_CART_KEY)
    const items = stored ? JSON.parse(stored) : []
    return Array.isArray(items) ? items : []
  } catch (error) {
    console.error('Could not read the saved shopping bag.', error)
    return []
  }
}

function writeGuestCart(items) {
  try {
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
  } catch (error) {
    console.error('Could not save the shopping bag on this device.', error)
  }
}

export function CatalogProvider({ children }) {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const catalogLoaded = useRef(false)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [featureImages, setFeatureImages] = useState([])
  const [featuredImagePath, setFeaturedImagePath] = useState(null)
  const [homepageContent, setHomepageContent] = useState(DEFAULT_HOMEPAGE_CONTENT)
  const [pricingWarning, setPricingWarning] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshCatalog = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const catalog = await getCatalog()
      setProducts(catalog.products)
      setCategories(catalog.categories)
      setFeatureImages(catalog.featureImages)
      setFeaturedImagePath(catalog.featuredImagePath)
      setHomepageContent(catalog.homepageContent)
      setPricingWarning(catalog.pricingWarning)
    } catch (cause) {
      console.error('Could not load the product catalog.', cause)
      setError(cause.message || 'The catalog could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdminRoute || catalogLoaded.current) return undefined

    let active = true
    getCatalog()
      .then((catalog) => {
        if (!active) return
        catalogLoaded.current = true
        setProducts(catalog.products)
        setCategories(catalog.categories)
        setFeatureImages(catalog.featureImages)
        setFeaturedImagePath(catalog.featuredImagePath)
        setHomepageContent(catalog.homepageContent)
        setPricingWarning(catalog.pricingWarning)
      })
      .catch((cause) => {
        console.error('Could not load the product catalog.', cause)
        if (active) setError(cause.message || 'The catalog could not be loaded.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isAdminRoute])

  const value = useMemo(
    () => ({
      products,
      categories,
      featureImages,
      featuredImagePath,
      setFeaturedImagePath,
      homepageContent,
      setHomepageContent,
      pricingWarning,
      loading,
      error,
      refreshCatalog,
    }),
    [products, categories, featureImages, featuredImagePath, homepageContent, setHomepageContent, pricingWarning, loading, error, refreshCatalog],
  )

  useEffect(() => {
    document.title = homepageContent.browserTitle
  }, [homepageContent.browserTitle])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function AuthProvider({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(isSupabaseConfigured)
  const [profileLoading, setProfileLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionExpired, setSessionExpired] = useState(false)
  const profileUserId = useRef(null)
  const currentPath = useRef(location.pathname)
  const navigateRef = useRef(navigate)
  const handlingExpiredSession = useRef(false)
  const expireSessionRef = useRef(null)

  useEffect(() => {
    currentPath.current = location.pathname
  }, [location.pathname])

  useEffect(() => {
    navigateRef.current = navigate
  }, [navigate])

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined

    let active = true
    let subscription
    let removeSessionExpiredHandler
    let expireCurrentSession
    requireSupabase()
      .then(async (client) => {
        if (!active) return
        const handleSessionExpired = async () => {
          if (!active || handlingExpiredSession.current) return
          handlingExpiredSession.current = true
          setSessionExpired(true)
          setUser(null)
          setProfile(null)
          setError('')
          setProfileLoading(false)
          setSessionLoading(false)
          navigateRef.current('/login', {
            replace: true,
            state: { sessionExpired: true, from: currentPath.current },
          })
          try {
            const { error: signOutError } = await client.auth.signOut({ scope: 'local' })
            if (signOutError) {
              console.error('Could not clear the expired local session.', signOutError)
            }
          } catch (cause) {
            console.error('Could not clear the expired local session.', cause)
          }
        }
        expireCurrentSession = handleSessionExpired
        expireSessionRef.current = handleSessionExpired
        removeSessionExpiredHandler = onSessionExpired(handleSessionExpired)
        const { data, error: sessionError } = await client.auth.getSession()
        if (sessionError) throw sessionError
        if (!active) return
        const initialUser = data.session?.user ?? null
        profileUserId.current = initialUser?.id ?? null
        setUser(initialUser)
        setProfileLoading(Boolean(initialUser))
        const result = client.auth.onAuthStateChange((event, session) => {
          const nextUser = session?.user ?? null
          const nextUserId = nextUser?.id ?? null
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            handlingExpiredSession.current = false
            setSessionExpired(false)
          }
          if (profileUserId.current !== nextUserId) {
            profileUserId.current = nextUserId
            setProfileLoading(Boolean(nextUser))
            if (!nextUser) setProfile(null)
          }
          setUser(nextUser)
          setError('')
          setSessionLoading(false)
        })
        subscription = result.data.subscription
      })
      .catch((cause) => {
        console.error('Could not restore the saved session.', cause)
        if (isExpiredSessionError(cause.message)) {
          expireCurrentSession?.()
        } else if (active) {
          setError(cause.message || 'Could not restore your session.')
        }
      })
      .finally(() => {
        if (active) setSessionLoading(false)
      })

    return () => {
      active = false
      expireSessionRef.current = null
      subscription?.unsubscribe()
      removeSessionExpiredHandler?.()
    }
  }, [])

  // The profile id is the same UUID as the Supabase Auth user id.
  const authId = user?.id
  useEffect(() => {
    if (!authId) {
      Promise.resolve().then(() => {
        setProfile(null)
        setProfileLoading(false)
      })
      return undefined
    }
    let active = true
    requireSupabase()
      .then((client) =>
        client
          .from('users')
          .select('id,role_id,full_name,phone_number,status,user_roles(role_name)')
          .eq('id', authId)
          .maybeSingle(),
      )
      .then(({ data, error: profileError }) => {
        if (profileError) throw profileError
        if (active) setProfile(data)
      })
      .catch((cause) => {
        console.error('Could not load your customer record.', cause)
        if (!active) return
        if (isExpiredSessionError(cause.message)) {
          expireSessionRef.current?.()
        } else {
          setError(cause.message || 'Could not load your account.')
        }
      })
      .finally(() => {
        if (active) setProfileLoading(false)
      })

    return () => {
      active = false
    }
  }, [authId])

  const value = useMemo(
    () => ({
      user,                          // Supabase auth user (uuid)
      profile,                       // row from your users table
      customerId: profile?.id ?? null,
      loading: sessionLoading || profileLoading,
      error,
      sessionExpired,
    }),
    [user, profile, sessionLoading, profileLoading, error, sessionExpired],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState(readGuestCart)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadCart = useCallback(async () => {
    if (!user) {
      const guestItems = readGuestCart()
      setItems(guestItems)
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const client = await requireSupabase()
      const guestItems = readGuestCart()
      for (const guestItem of guestItems) {
        let existingQuery = client
          .from('carts')
          .select('id,quantity')
          .eq('user_id', user.id)
          .eq('product_id', guestItem.product_id)
        existingQuery = guestItem.product_variant_id
          ? existingQuery.eq('product_variant_id', guestItem.product_variant_id)
          : existingQuery.is('product_variant_id', null)
        const { data: existing, error: lookupError } = await existingQuery.maybeSingle()
        if (lookupError) throw lookupError

        const result = existing
          ? await client
              .from('carts')
              .update({ quantity: Number(existing.quantity) + guestItem.quantity })
              .eq('id', existing.id)
              .eq('user_id', user.id)
          : await client.from('carts').insert({
              user_id: user.id,
              product_id: guestItem.product_id,
              product_variant_id: guestItem.product_variant_id ?? null,
              quantity: guestItem.quantity,
            })
        if (result.error) throw result.error
      }

      if (guestItems.length) window.localStorage.removeItem(GUEST_CART_KEY)
      const { data, error: cartError } = await client
        .from('carts')
        .select('id,user_id,product_id,product_variant_id,quantity')
        .eq('user_id', user.id)
        .order('created_at')
      if (cartError) throw cartError
      setItems(data ?? [])
    } catch (cause) {
      console.error('Could not load your shopping bag.', cause)
      setError(cause.message || 'Your shopping bag could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    Promise.resolve().then(loadCart)
  }, [loadCart])

  const addItem = useCallback(
    async (product, variant, quantity = 1) => {
      setError('')
      const productId = product.id
      const variantId = variant?.id ?? null
      const addQuantity = Math.floor(Number(quantity))
      if (!Number.isFinite(addQuantity) || addQuantity < 1) {
        throw new Error('Quantity must be at least one.')
      }
      const available = Number(variant?.stock_quantity ?? product.stock ?? 0)
      if (addQuantity > available) {
        throw new Error(`Only ${available} of this piece are currently available.`)
      }

      if (user) {
        const client = await requireSupabase()
        let lookup = client
          .from('carts')
          .select('id,quantity')
          .eq('user_id', user.id)
          .eq('product_id', productId)
        lookup = variantId
          ? lookup.eq('product_variant_id', variantId)
          : lookup.is('product_variant_id', null)
        const { data: existing, error: lookupError } = await lookup.maybeSingle()
        if (lookupError) throw lookupError
        if (Number(existing?.quantity || 0) + addQuantity > available) {
          throw new Error(`Only ${available} of this piece are currently available.`)
        }

        const result = existing
          ? await client
              .from('carts')
              .update({ quantity: Number(existing.quantity) + addQuantity })
              .eq('id', existing.id)
              .eq('user_id', user.id)
          : await client.from('carts').insert({
              user_id: user.id,
              product_id: productId,
              product_variant_id: variantId,
              quantity: addQuantity,
            })
        if (result.error) throw result.error
        await loadCart()
        return
      }

      const guestItems = readGuestCart()
      const existing = guestItems.find(
        (item) =>
          item.product_id === productId &&
          (item.product_variant_id ?? null) === variantId,
      )
      if (Number(existing?.quantity || 0) + addQuantity > available) {
        throw new Error(`Only ${available} of this piece are currently available.`)
      }
      const nextItems = existing
        ? guestItems.map((item) =>
            item === existing ? { ...item, quantity: item.quantity + addQuantity } : item,
          )
        : [
            ...guestItems,
            { product_id: productId, product_variant_id: variantId, quantity: addQuantity },
          ]
      writeGuestCart(nextItems)
      setItems(nextItems)
    },
    [loadCart, user],
  )

  const updateQuantity = useCallback(
    async (item, quantity) => {
      const nextQuantity = Math.floor(Number(quantity))
      if (!Number.isFinite(nextQuantity) || nextQuantity < 1) {
        throw new Error('Quantity must be at least one.')
      }

      if (user) {
        const client = await requireSupabase()
        const { error: updateError } = await client
          .from('carts')
          .update({ quantity: nextQuantity })
          .eq('id', item.id)
          .eq('user_id', user.id)
        if (updateError) throw updateError
        await loadCart()
        return
      }

      const nextItems = items.map((current) =>
        current.product_id === item.product_id &&
        (current.product_variant_id ?? null) === (item.product_variant_id ?? null)
          ? { ...current, quantity: nextQuantity }
          : current,
      )
      writeGuestCart(nextItems)
      setItems(nextItems)
    },
    [items, loadCart, user],
  )

  const removeItem = useCallback(
    async (item) => {
      if (user) {
        const client = await requireSupabase()
        const { error: removeError } = await client
          .from('carts')
          .delete()
          .eq('id', item.id)
          .eq('user_id', user.id)
        if (removeError) throw removeError
        await loadCart()
        return
      }

      const nextItems = items.filter(
        (current) =>
          current.product_id !== item.product_id ||
          (current.product_variant_id ?? null) !== (item.product_variant_id ?? null),
      )
      writeGuestCart(nextItems)
      setItems(nextItems)
    },
    [items, loadCart, user],
  )

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((total, item) => total + Number(item.quantity || 0), 0),
      loading,
      error,
      addItem,
      updateQuantity,
      removeItem,
      refreshCart: loadCart,
    }),
    [items, loading, error, addItem, updateQuantity, removeItem, loadCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function ShopProviders({ children }) {
  return (
    <CatalogProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </CatalogProvider>
  )
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (!context) throw new Error('useCatalog must be used inside CatalogProvider.')
  return context
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider.')
  return context
}