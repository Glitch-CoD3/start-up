import { ArrowLeft, Boxes, Image, Layout as LayoutIcon, LayoutDashboard, LogOut, Package, Settings, Shapes, ShoppingBag, Tag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../app/providers'
import { requireSupabase } from '../../lib/supabase'
import ThemeToggle from '../ui/ThemeToggle'

const adminPageLoaders = [
  () => import('../../features/admin/pages/DashboardPage'),
  () => import('../../features/admin/pages/ProductsPage'),
  () => import('../../features/admin/pages/ProductEditPage'),
  () => import('../../features/admin/pages/InventoryPage'),
  () => import('../../features/admin/pages/CategoriesPage'),
  () => import('../../features/admin/pages/BrandsPage'),
  () => import('../../features/admin/pages/FeatureImagesPage'),
  () => import('../../features/admin/pages/LayoutPage'),
  () => import('../../features/admin/pages/SettingsPage'),
  () => import('../../features/admin/pages/OrdersPage'),
  () => import('../../features/admin/pages/OrderDetailPage'),
]

const navigation = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Shapes },
  { to: '/admin/brands', label: 'Brands', icon: Tag },
  { to: '/admin/images', label: 'Feature images', icon: Image },
  { to: '/admin/settings', label: 'Store settings', icon: Settings },
  { to: '/admin/layout', label: 'Layout', icon: LayoutIcon },
]

export default function AdminLayout() {
  const { user } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    adminPageLoaders.forEach((loadPage) => {
      loadPage().catch((cause) => {
        console.error('Could not preload an admin page.', cause)
      })
    })
  }, [])

  const signOut = async () => {
    setSigningOut(true)
    try {
      const client = await requireSupabase()
      const { error } = await client.auth.signOut()
      if (error) throw error
      navigate('/login', { replace: true })
    } catch (cause) {
      toast.error(cause.message || 'Could not sign out.')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand__mark">TL<span>.</span></span>
          <span>Store administration</span>
        </div>
        <nav className="admin-nav" aria-label="Admin navigation">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink to={to} end={end} key={to} className={({ isActive }) => `admin-nav__link${isActive ? ' is-active' : ''}`}>
              <Icon size={17} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <span className="admin-sidebar__email">{user?.email}</span>
          <div className="admin-theme-control"><ThemeToggle /><span>Switch appearance</span></div>
          <button className="admin-nav__link" type="button" onClick={signOut} disabled={signingOut}>
            <LogOut size={17} /> {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
          <NavLink className="admin-back-link" to="/"><ArrowLeft size={15} /> Back to store</NavLink>
        </div>
      </aside>
      <main className="admin-main"><Outlet /></main>
    </div>
  )
}