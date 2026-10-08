import { MapPin } from 'lucide-react'

export default function AddressSelect({ addresses, value, onChange }) {
  if (!addresses.length) {
    return <div className="checkout-no-address"><MapPin size={19} /><span>Add a delivery address to continue to payment.</span></div>
  }

  return (
    <div className="checkout-address-list">
      {addresses.map((address) => (
        <label className={`checkout-address${value === address.id ? ' checkout-address--selected' : ''}`} key={address.id}>
          <input
            type="radio"
            name="shipping-address"
            value={address.id}
            checked={value === address.id}
            onChange={() => onChange(address.id)}
            required
          />
          <span className="checkout-address__body">
            <span className="checkout-address__title">
              <strong>{address.city}{address.state ? `, ${address.state}` : ''}</strong>
              {address.is_default && <small>Default</small>}
            </span>
            <span>{address.full_address}</span>
            <span>{address.phone_number}</span>
          </span>
        </label>
      ))}
    </div>
  )
}