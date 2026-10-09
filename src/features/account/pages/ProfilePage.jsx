import { ArrowRight, LogOut, MapPin, MessageCircle, PackageCheck, ShoppingBag, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth, useCart } from '../../../app/providers'
import { requireSupabase } from '../../../lib/supabase'
import useOrders from '../hooks/useOrders'
import OrderCard from '../components/OrderCard'

export default function ProfilePage() {
  const { user } = useAuth()
  const { count } = useCart()
  const { orders, loading: ordersLoading, error: ordersError } = useOrders()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'

  const signOut = async () => {
    setSigningOut(true)
    try {
      const client = await requireSupabase()
      const { error } = await client.auth.signOut()
      if (error) throw error
      toast.success('You’ve been signed out.')
      navigate('/')
    } catch (cause) {
      toast.error(cause.message || 'Could not sign out.')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <section className="account-page">
      <span className="eyebrow">Your little corner</span>
      <h1>Good to see you, <em>{name}.</em></h1>
      <p className="account-intro">Your Trendlama account, all in one easy place.</p>
      <div className="account-card">
        <div className="account-card__identity">
          <span className="account-avatar"><UserRound size={23} /></span>
          <div><span className="eyebrow">Signed in as</span><strong>{user?.email}</strong></div>
        </div>
        <div className="account-card__links">
          <Link to="/shop"><span><ShoppingBag size={18} /> Keep shopping</span><ArrowRight size={16} /></Link>
          <Link to="/cart"><span><PackageCheck size={18} /> Your bag <small>{count} {count === 1 ? 'piece' : 'pieces'}</small></span><ArrowRight size={16} /></Link>
          <Link to="/account/addresses"><span><MapPin size={18} /> Delivery addresses</span><ArrowRight size={16} /></Link>
          <Link to="/contact"><span><MessageCircle size={18} /> Contact support</span><ArrowRight size={16} /></Link>
        </div>
        <button className="account-signout" type="button" onClick={signOut} disabled={signingOut}>
          <LogOut size={16} /> {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
      <section className="order-history">
        <div className="order-history__heading">
          <div><span className="eyebrow">A little history</span><h2>Your orders</h2></div>
          <span>{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span>
        </div>
        {ordersLoading ? (
          <p className="order-history__message">Gathering your orders…</p>
        ) : ordersError ? (
          <div className="notice notice--error" role="alert">{ordersError}</div>
        ) : orders.length ? (
          <div className="order-history__list">
            {orders.map((order) => <OrderCard key={order.id} order={order} />)}
          </div>
        ) : (
          <div className="order-history__empty">
            <p>No orders yet. That just means the best part is still ahead.</p>
            <Link className="text-link" to="/shop">Find something you love <ArrowRight size={15} /></Link>
          </div>
        )}
      </section>
    </section>
  )
}