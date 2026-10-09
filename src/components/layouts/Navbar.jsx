import { ArrowRight, Menu, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth, useCatalog } from '../../app/providers'
import CartIcon from '../../features/cart/components/CartIcon'
import SearchBar from '../../features/catalog/components/SearchBar'
import ThemeToggle from '../ui/ThemeToggle'

export default function Navbar() {
  const { user, profile } = useAuth()
  const { categories, homepageContent } = useCatalog()
  const [menuOpen, setMenuOpen] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const { pathname, search } = useLocation()
  const searchParams = new URLSearchParams(search)
  const selectedCategory = searchParams.get('category')
  const selectedSort = searchParams.get('sort')
  const isShop = pathname === '/shop'

  useEffect(() => {
    const updateScrollState = () => setHasScrolled(window.scrollY > 12)
    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })
    return () => window.removeEventListener('scroll', updateScrollState)
  }, [])

  return (
    <>
      <div className="announcement">
        <span>Delivery charges shown at checkout</span>
        <span className="announcement__desktop">A little something for your everyday.</span>
        <Link to="/shop">Explore the new collection <ArrowRight size={13} /></Link>
      </div>
      <header className={`site-header${hasScrolled ? ' site-header--scrolled' : ''}`}>
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
          <img className="wordmark__icon" src={homepageContent.logoIcon || '/icon.svg'} alt="" aria-hidden="true" />
          <span className="wordmark__name">{homepageContent.logoName}<span>.</span></span>
        </Link>
        <nav className={`primary-nav${menuOpen ? ' primary-nav--open' : ''}`} aria-label="Main navigation">
          <Link
            className={isShop && !selectedCategory && selectedSort !== 'newest' ? 'is-active' : undefined}
            aria-current={isShop && !selectedCategory && selectedSort !== 'newest' ? 'page' : undefined}
            to="/shop"
            onClick={() => setMenuOpen(false)}
          >
            Shop all
          </Link>
          {categories.slice(0, 3).map((category) => (
            <Link
              className={selectedCategory === (category.slug || category.name.toLowerCase()) ? 'is-active' : undefined}
              aria-current={selectedCategory === (category.slug || category.name.toLowerCase()) ? 'page' : undefined}
              to={`/shop?category=${encodeURIComponent(category.slug || category.name.toLowerCase())}`}
              onClick={() => setMenuOpen(false)}
              key={category.id}
            >
              {category.name}
            </Link>
          ))}


          {/* <Link
            className={isShop && selectedSort === 'newest' ? 'is-active' : undefined}
            aria-current={isShop && selectedSort === 'newest' ? 'page' : undefined}
            to="/shop?sort=newest"
            onClick={() => setMenuOpen(false)}
          >
            New arrivals
          </Link> */}

          
          {profile?.user_roles?.role_name === 'admin' && (
            <Link
              className={pathname.startsWith('/admin') ? 'is-active' : undefined}
              aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
              to="/admin"
              onClick={() => setMenuOpen(false)}
            >
              Admin
            </Link>
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