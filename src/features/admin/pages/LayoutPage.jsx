import { Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { DEFAULT_HOMEPAGE_CONTENT, HOMEPAGE_CONTENT_FIELDS } from '../../catalog/homepageContent'
import { getHomepageContent, saveHomepageContent } from '../api'

export default function LayoutPage() {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getHomepageContent()
      .then((homepageContent) => {
        if (active) setContent({ ...DEFAULT_HOMEPAGE_CONTENT, ...homepageContent })
      })
      .catch((cause) => {
        console.error('Could not load layout content.', cause)
        if (active) setError(cause.message || 'Layout content could not be loaded.')
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const saved = await saveHomepageContent(content)
      setContent({ ...DEFAULT_HOMEPAGE_CONTENT, ...saved })
      toast.success('Layout content updated.')
    } catch (cause) {
      console.error('Could not save layout content.', cause)
      setError(cause.message || 'Layout content could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__heading">
        <div><span className="eyebrow">Control your storefront appearance</span><h1>Layout</h1></div>
      </header>
      {error && <div className="notice notice--error" role="alert">{error}</div>}
      {loading ? <p className="admin-message">Loading layout content…</p> : content && (
        <form className="admin-form-card admin-settings-card" onSubmit={submit}>
          <div className="admin-section__heading">
            <div><span className="eyebrow">Edit without a code deployment</span><h2>Store branding &amp; homepage text</h2></div>
          </div>
          <div className="admin-form-grid">
            {HOMEPAGE_CONTENT_FIELDS.map(({ key, label, multiline }) => (
              <label className={`admin-field${multiline ? ' homepage-content-field--wide' : ''}`} key={key}>
                <span>{label}</span>
                {multiline ? (
                  <textarea
                    required
                    maxLength="500"
                    rows="3"
                    value={content[key]}
                    onChange={(event) => setContent((current) => ({ ...current, [key]: event.target.value }))}
                  />
                ) : (
                  <input
                    required
                    maxLength="500"
                    value={content[key]}
                    onChange={(event) => setContent((current) => ({ ...current, [key]: event.target.value }))}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="admin-taxonomy-form__actions">
            <button className="admin-button admin-button--light" type="button" onClick={() => setContent({ ...DEFAULT_HOMEPAGE_CONTENT })}>Restore defaults</button>
            <button className="admin-button" type="submit" disabled={saving}><Save size={15} /> {saving ? 'Saving…' : 'Save layout'}</button>
          </div>
        </form>
      )}
    </div>
  )
}
