import { ImagePlus, LoaderCircle, Save, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useCatalog } from '../../../app/providers'
import { DEFAULT_HOMEPAGE_CONTENT, HOMEPAGE_CONTENT_FIELDS } from '../../catalog/homepageContent'
import { getHomepageContent, saveHomepageContent } from '../api'
import { FEATURE_IMAGE_FOLDER, uploadImage } from '../storage'

export default function LayoutPage() {
  const { setHomepageContent } = useCatalog()
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const [error, setError] = useState('')
  const iconInputRef = useRef(null)

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
      const updatedContent = { ...DEFAULT_HOMEPAGE_CONTENT, ...saved }
      setContent(updatedContent)
      setHomepageContent(updatedContent)
      toast.success('Layout content updated.')
    } catch (cause) {
      console.error('Could not save layout content.', cause)
      setError(cause.message || 'Layout content could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const uploadLogoIcon = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploadingIcon(true)
    setError('')
    try {
      const uploaded = await uploadImage(file, FEATURE_IMAGE_FOLDER)
      setContent((current) => ({ ...current, logoIcon: uploaded.url }))
      toast.success('Logo icon uploaded.')
    } catch (cause) {
      console.error('Could not upload the logo icon.', cause)
      setError(cause.message || 'Logo icon could not be uploaded.')
    } finally {
      setUploadingIcon(false)
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
            {HOMEPAGE_CONTENT_FIELDS.map(({ key, label, multiline, select }) => (
              <label className={`admin-field${multiline ? ' homepage-content-field--wide' : ''}`} key={key}>
                <span>{label}</span>
                {select ? (
                  <select
                    value={content[key]}
                    onChange={(event) => setContent((current) => ({ ...current, [key]: event.target.value }))}
                  >
                    <option value="static">Static image</option>
                    <option value="slider">Image slider</option>
                  </select>
                ) : multiline ? (
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
          <section className="admin-logo-icon" aria-label="Navbar logo icon">
            <div>
              <span className="eyebrow">Navbar branding</span>
              <h3>Logo icon</h3>
              <p className="admin-message">Choose the icon shown before your logo name. Upload a JPG, PNG, WebP, AVIF, or GIF (up to 10 MB).</p>
            </div>
            <div className="admin-logo-icon__controls">
              <div className="admin-logo-icon__preview">
                <img src={content.logoIcon || DEFAULT_HOMEPAGE_CONTENT.logoIcon} alt="Current navbar logo icon" />
              </div>
              <input
                ref={iconInputRef}
                className="admin-image-uploader__input"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                onChange={uploadLogoIcon}
                disabled={uploadingIcon}
                aria-label="Choose a navbar logo icon"
              />
              <button
                className="admin-button admin-button--small"
                type="button"
                onClick={() => iconInputRef.current?.click()}
                disabled={uploadingIcon}
              >
                {uploadingIcon ? <LoaderCircle className="admin-spinner" size={15} /> : <ImagePlus size={15} />}
                {uploadingIcon ? 'Uploading…' : 'Upload icon'}
              </button>
              {content.logoIcon !== DEFAULT_HOMEPAGE_CONTENT.logoIcon && (
                <button
                  className="admin-button admin-button--light admin-button--small"
                  type="button"
                  onClick={() => setContent((current) => ({ ...current, logoIcon: DEFAULT_HOMEPAGE_CONTENT.logoIcon }))}
                >
                  <X size={15} /> Use default icon
                </button>
              )}
            </div>
          </section>
          <div className="admin-taxonomy-form__actions">
            <button className="admin-button admin-button--light" type="button" onClick={() => setContent({ ...DEFAULT_HOMEPAGE_CONTENT })}>Restore defaults</button>
            <button className="admin-button" type="submit" disabled={saving}><Save size={15} /> {saving ? 'Saving…' : 'Save layout'}</button>
          </div>
        </form>
      )}
    </div>
  )
}
