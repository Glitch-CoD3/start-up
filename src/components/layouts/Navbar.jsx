import { ArrowRight, Menu, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, useCatalog } from '../../app/providers'
import CartIcon from '../../features/cart/components/CartIcon'
import SearchBar from '../../features/catalog/components/SearchBar'
import ThemeToggle from '../ui/ThemeToggle'

export default function Navbar() {
  const { user, profile } = useAuth()
  const { categories, homepageContent } = useCatalog()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <div className="announcement">
        <span>Delivery charges shown at checkout</span>
        <span className="announcement__desktop">A little something for your everyday.</span>
        <Link to="/shop">Explore the edit <ArrowRight size={13} /></Link>
      </div>
      <header className="site-header">
        <button
          className="icon-button mobile-menu-toggle"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <Link className="wordmark" to="/" aria-label={`${homepageContent.logoName} home`}>
          {homepageContent.logoName}<span>.</span>
        </Link>
        <nav className={`primary-nav${menuOpen ? ' primary-nav--open' : ''}`} aria-label="Main navigation">
          <Link to="/shop" onClick={() => setMenuOpen(false)}>Shop all</Link>
          {categories.slice(0, 3).map((category) => (
            <Link
              to={`/shop?category=${encodeURIComponent(category.slug || category.name.toLowerCase())}`}
              onClick={() => setMenuOpen(false)}
              key={category.id}
            >
              {category.name}
            </Link>
          ))}
          <Link to="/shop?sort=newest" onClick={() => setMenuOpen(false)}>New arrivals</Link>
          {profile?.user_roles?.role_name === 'admin' && (
            <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>
          )}
        </nav>
        <div className="header-actions">
          <SearchBar />
          <ThemeToggle />
          <Link
            className="icon-button header-account"
            to={user ? '/account' : '/login'}
            aria-label={user ? 'Your account' : 'Sign in'}
            title={user ? 'Your account' : 'Sign in'}
          >
            <UserRound size={19} />
          </Link>
          <CartIcon />
        </div>
      </header>
    </>
  )
}