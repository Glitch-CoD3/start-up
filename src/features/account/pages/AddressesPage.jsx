import { ArrowLeft, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import AddressForm from '../components/AddressForm'
import useAddresses from '../hooks/useAddresses'

export default function AddressesPage() {
  const { addresses, loading, error, save, remove } = useAddresses()
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  const submit = async (address) => {
    setSaving(true)
    try {
      await save(address)
      setEditing(null)
      setAdding(false)
      toast.success(address.id ? 'Address updated.' : 'Address saved.')
    } catch (cause) {
      toast.error(cause.message || 'Could not save this address.')
    } finally {
      setSaving(false)
    }
  }

  const deleteAddress = async (id) => {
    try {
      await remove(id)
      toast.success('Address removed.')
    } catch (cause) {
      toast.error(cause.message || 'Could not remove this address.')
    }
  }

  return (
    <section className="addresses-page">
      <Link className="back-link" to="/account"><ArrowLeft size={15} /> Back to your account</Link>
      <div className="addresses-heading">
        <div><span className="eyebrow">One less thing to think about</span><h1>Your addresses<span>.</span></h1></div>
        {!adding && !editing && (
          <button className="button button--dark" type="button" onClick={() => setAdding(true)}><Plus size={16} /> Add an address</button>
        )}
      </div>
      {error && <div className="notice notice--error" role="alert">{error}</div>}
      {(adding || editing) && (
        <AddressForm
          key={editing?.id ?? 'new-address'}
          address={editing || undefined}
          onSubmit={submit}
          onCancel={() => { setAdding(false); setEditing(null) }}
          saving={saving}
        />
      )}
      {loading ? (
        <p className="order-history__message">Finding your saved addresses…</p>
      ) : addresses.length ? (
        <div className="address-list">
          {addresses.map((address) => (
            <article className="address-card" key={address.id}>
              <div className="address-card__icon"><MapPin size={18} /></div>
              <div className="address-card__content">
                <div className="address-card__title">
                  <strong>{address.city}{address.state ? `, ${address.state}` : ''}</strong>
                  {address.is_default && <span className="address-default-badge">Default</span>}
                </div>
                <p>{address.full_address}</p>
                <span>{address.phone_number}</span>
                {address.zip_code && <span>Postal code · {address.zip_code}</span>}
              </div>
              <div className="address-card__actions">
                <button type="button" onClick={() => { setEditing(address); setAdding(false) }} aria-label="Edit address"><Pencil size={15} /></button>
                <button type="button" onClick={() => deleteAddress(address.id)} aria-label="Remove address"><Trash2 size={15} /></button>
              </div>
            </article>
          ))}
        </div>
      ) : !adding && !editing ? (
        <div className="order-history__empty">
          <p>Your delivery details will be ready whenever you need them.</p>
          <button className="text-link" type="button" onClick={() => setAdding(true)}>Add your first address <Plus size={15} /></button>
        </div>
      ) : null}
    </section>
  )
}