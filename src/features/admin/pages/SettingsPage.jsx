import { Database, Save, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getStoreDeliverySettings, saveStoreDeliverySettings } from '../api'

export default function SettingsPage() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getStoreDeliverySettings()
      .then((data) => {
        if (active) setSettings({
          dhaka_delivery_charge: String(data.dhaka_delivery_charge),
          outside_dhaka_delivery_charge: String(data.outside_dhaka_delivery_charge),
          catalog_cache_ttl_seconds: data.catalog_cache_ttl_seconds == null
            ? ''
            : String(data.catalog_cache_ttl_seconds),
        })
      })
      .catch((cause) => {
        console.error('Could not load store delivery settings.', cause)
        if (active) setError(cause.message || 'Store settings could not be loaded.')
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const saved = await saveStoreDeliverySettings(settings)
      setSettings({
        dhaka_delivery_charge: String(saved.dhaka_delivery_charge),
        outside_dhaka_delivery_charge: String(saved.outside_dhaka_delivery_charge),
        catalog_cache_ttl_seconds: String(saved.catalog_cache_ttl_seconds),
      })
      toast.success('Store settings updated.')
    } catch (cause) {
      console.error('Could not save store settings.', cause)
      setError(cause.message || 'Store settings could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__heading">
        <div><span className="eyebrow">Set how your store delivers</span><h1>Store settings</h1></div>
      </header>
      {error && <div className="notice notice--error" role="alert">{error}</div>}
      {loading ? <p className="admin-message">Loading store settings…</p> : settings && (
        <form className="admin-form-card admin-settings-card" onSubmit={submit}>
          <div className="admin-section__heading">
            <div><span className="eyebrow">Delivery charges · BDT</span><h2><Truck size={19} /> Delivery pricing</h2></div>
          </div>
          <p className="admin-message">Addresses containing “Dhaka” (in full address, city, or district) use the Dhaka charge. Other addresses use the outside Dhaka charge. The checkout calculation is performed and saved by the database.</p>
          <div className="admin-form-grid">
            <label className="admin-field"><span>Dhaka delivery charge (৳)</span><input type="number" min="0" step="0.01" required value={settings.dhaka_delivery_charge} onChange={(event) => setSettings((current) => ({ ...current, dhaka_delivery_charge: event.target.value }))} /></label>
            <label className="admin-field"><span>Outside Dhaka delivery charge (৳)</span><input type="number" min="0" step="0.01" required value={settings.outside_dhaka_delivery_charge} onChange={(event) => setSettings((current) => ({ ...current, outside_dhaka_delivery_charge: event.target.value }))} /></label>
          </div>
          <div className="admin-section__heading">
            <div><span className="eyebrow">Saved store preference</span><h2><Database size={19} /> Catalog cache TTL</h2></div>
          </div>
          <p className="admin-message">This TTL remains saved in the database for future use. Redis catalog caching is currently disabled, so changing this value does not affect product fetching.</p>
          {!settings.catalog_cache_ttl_seconds && <div className="notice notice--error" role="alert">Run the updated supabase_store_pricing.sql migration before configuring the catalog cache TTL.</div>}
          <div className="admin-form-grid">
            <label className="admin-field"><span>Cache TTL (seconds)</span><input type="number" min="1" max="86400" step="1" required value={settings.catalog_cache_ttl_seconds} onChange={(event) => setSettings((current) => ({ ...current, catalog_cache_ttl_seconds: event.target.value }))} /></label>
          </div>
          <div className="admin-taxonomy-form__actions"><button className="admin-button" type="submit" disabled={saving}><Save size={15} /> {saving ? 'Saving…' : 'Save store settings'}</button></div>
        </form>
      )}
    </div>
  )
}
