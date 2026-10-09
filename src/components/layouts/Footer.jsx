import { ArrowUpRight, Camera } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCatalog } from '../../app/providers'

export default function Footer() {
  const { homepageContent } = useCatalog()

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link className="wordmark wordmark--footer" to="/">{homepageContent.logoName}<span>.</span></Link>
          <p>Thoughtful pieces for wherever<br />the day takes you.</p>
          <a className="social-link" href="https://bd-trend.netlify.app/" target="_blank" rel="noreferrer">
            <Camera size={17} /> Follow along <ArrowUpRight size={14} />
          </a>
        </div>
        <div className="footer-column">
          <p className="footer-heading">Discover</p>
          <Link to="/shop">Shop all</Link>
          <Link to="/shop?sort=newest">New arrivals</Link>
          <Link to="/cart">Your shopping bag</Link>
          <Link to="/contact">Contact support</Link>
        </div>
        <div className="footer-column">
          <p className="footer-heading">We’re here</p>
          <a href="mailto:hello@trendlama.com">hello@trendlama.com</a>
          <p>Sunday — Thursday<br />10:00 am — 6:00 pm</p>
        </div>
        <div className="footer-note">
          <span className="eyebrow">A note from us</span>
          <p>Good style isn’t complicated. It’s the pieces you reach for, again and again.</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {homepageContent.logoName}. Made for the everyday.</span>
        <span>Dhaka, Bangladesh · Prices in BDT</span>
      </div>
    </footer>
  )
}