import { ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../../../app/providers'

export default function CartIcon() {
  const { count } = useCart()
  return (
    <Link className="icon-button bag-button" to="/cart" aria-label={`Shopping bag, ${count} items`}>
      <ShoppingBag size={19} />
      <span className="bag-count">{count}</span>
    </Link>
  )
}
