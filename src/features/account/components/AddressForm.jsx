import { MapPin, X } from 'lucide-react'
import { useState } from 'react'

const emptyAddress = {
  full_address: '',
  phone_number: '',
  city: '',
  state: '',
  zip_code: '',
  is_default: false,
}

export default function AddressForm({ address, onSubmit, onCancel, saving }) {
  const [fields, setFields] = useState(() => ({ ...emptyAddress, ...address }))
  const update = (key, value) => setFields((current) => ({ ...current, [key]: value }))

  const submit = (event) => {
    event.preventDefault()
    onSubmit({
      ...fields,
      full_address: fields.full_address.trim(),
      phone_number: fields.phone_number.trim(),
      city: fields.city.trim(),
      state: fields.state.trim(),
      zip_code: fields.zip_code.trim(),
    })
  }

  return (
    <form className="address-form" onSubmit={submit}>
      <div className="address-form__heading">
        <div><span className="eyebrow">{address ? 'A little update' : 'Make it easy next time'}</span><h2>{address ? 'Edit address' : 'Add a delivery address'}</h2></div>
        {onCancel && <button className="icon-button" type="button" aria-label="Close address form" onClick={onCancel}><X size={18} /></button>}
      </div>
      <label className="field">
        <span>Full address</span>
        <span className="field__input field__input--textarea"><MapPin size={17} /><textarea required rows="3" value={fields.full_address} onChange={(event) => update('full_address', event.target.value)} placeholder="House, road, area — the details your delivery needs" /></span>
      </label>
      <div className="address-form__row">
        <label className="field"><span>Phone number</span><span className="field__input"><input type="tel" required value={fields.phone_number} onChange={(event) => update('phone_number', event.target.value)} placeholder="+880 1XXXXXXXXX" /></span></label>
        <label className="field"><span>City</span><span className="field__input"><input required value={fields.city} onChange={(event) => update('city', event.target.value)} placeholder="Dhaka" /></span></label>
      </div>
      <div className="address-form__row">
        <label className="field"><span>State / district</span><span className="field__input"><input required value={fields.state} onChange={(event) => update('state', event.target.value)} placeholder="District" /></span></label>
        <label className="field"><span>Postal code</span><span className="field__input"><input value={fields.zip_code ?? ''} onChange={(event) => update('zip_code', event.target.value)} placeholder="Optional" /></span></label>
      </div>
      <label className="address-default">
        <input type="checkbox" checked={Boolean(fields.is_default)} onChange={(event) => update('is_default', event.target.checked)} />
        Save as my default delivery address
      </label>
      <div className="address-form__actions">
        {onCancel && <button className="button button--outline" type="button" onClick={onCancel}>Cancel</button>}
        <button className="button button--dark" type="submit" disabled={saving}>{saving ? 'Saving…' : address ? 'Save changes' : 'Save address'}</button>
      </div>
    </form>
  )
}