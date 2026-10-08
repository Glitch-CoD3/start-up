import { Check, Copy, ImagePlus, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useCatalog } from '../../../app/providers'
import ImageUploader from '../components/ImageUploader'
import {
  deleteImage,
  FEATURE_IMAGE_FOLDER,
  getHomepageFeatureImage,
  listImages,
  setHomepageFeatureImage,
} from '../storage'

export default function FeatureImagesPage() {
  const { setFeaturedImagePath: updateCatalogFeaturedImage } = useCatalog()
  const [images, setImages] = useState([])
  const [featuredImagePath, setFeaturedImagePath] = useState(null)
  const [savingFeaturedPath, setSavingFeaturedPath] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadImages = useCallback(() => Promise.all([
    listImages(FEATURE_IMAGE_FOLDER),
    getHomepageFeatureImage(),
  ]), [])

  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      const [nextImages, selectedPath] = await loadImages()
      setImages(nextImages)
      setFeaturedImagePath(selectedPath)
    } catch (cause) {
      console.error('Could not load feature images.', cause)
      setError(cause.message || 'Feature images could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    loadImages()
      .then(([nextImages, selectedPath]) => {
        if (!active) return
        setImages(nextImages)
        setFeaturedImagePath(selectedPath)
      })
      .catch((cause) => {
        console.error('Could not load feature images.', cause)
        if (active) setError(cause.message || 'Feature images could not be loaded.')
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [loadImages])

  const chooseFeaturedImage = async (image) => {
    setSavingFeaturedPath(image.path)
    try {
      await setHomepageFeatureImage(image.path)
      setFeaturedImagePath(image.path)
      updateCatalogFeaturedImage(image.path)
      toast.success('Homepage feature image updated.')
    } catch (cause) {
      console.error('Could not set the homepage feature image.', cause)
      toast.error(cause.message || 'Homepage feature image could not be updated.')
    } finally {
      setSavingFeaturedPath('')
    }
  }

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Image URL copied.')
    } catch (cause) {
      console.error('Could not copy feature image URL.', cause)
      toast.error('Could not copy the image URL. You can select and copy it from the image details.')
    }
  }

  const remove = async (image) => {
    if (!window.confirm('Permanently delete this feature image from storage?')) return
    try {
      if (featuredImagePath === image.path) {
        await setHomepageFeatureImage(null)
        setFeaturedImagePath(null)
        updateCatalogFeaturedImage(null)
      }
      await deleteImage(image.path, FEATURE_IMAGE_FOLDER)
      toast.success('Image deleted.')
      await refresh()
    } catch (cause) {
      console.error('Could not delete feature image.', cause)
      toast.error(cause.message || 'Image could not be deleted.')
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__heading">
        <div><span className="eyebrow">Images for storefront and website sections</span><h1>Feature images</h1></div>
        <button className="admin-button admin-button--light" type="button" onClick={refresh} disabled={loading}><RefreshCw size={15} /> Refresh</button>
      </header>
      <section className="admin-form-card admin-feature-upload">
        <div className="admin-section__heading"><div><span className="eyebrow">Upload to Supabase Storage</span><h2>Website feature images</h2></div></div>
        <p className="admin-message">Uploaded files are stored in <code>e-commerce/{FEATURE_IMAGE_FOLDER}/</code>. Select an image below to use it in the storefront homepage hero.</p>
        <ImageUploader images={[]} folder={FEATURE_IMAGE_FOLDER} onChange={refresh} />
      </section>
      {error && <div className="notice notice--error" role="alert">{error}</div>}
      <section className="admin-section">
        <div className="admin-section__heading"><div><span className="eyebrow">Storage bucket</span><h2>Uploaded images</h2></div><span className="admin-count">{images.length} images</span></div>
        {loading ? <p className="admin-message">Loading feature images…</p> : images.length ? (
          <div className="admin-media-grid">
            {images.map((image) => (
              <article className="admin-media-card" key={image.path}>
                <img src={image.url} alt={image.name} loading="lazy" />
                <div className="admin-media-card__info">
                  <strong title={image.name}>{image.name}</strong>
                  {featuredImagePath === image.path ? (
                    <span className="admin-featured-image"><Check size={14} /> Showing on homepage</span>
                  ) : (
                    <button
                      className="admin-button admin-button--light admin-button--small"
                      type="button"
                      onClick={() => chooseFeaturedImage(image)}
                      disabled={Boolean(savingFeaturedPath)}
                    >
                      {savingFeaturedPath === image.path ? 'Saving…' : 'Use on homepage'}
                    </button>
                  )}
                  <input aria-label={`Public URL for ${image.name}`} readOnly value={image.url} onFocus={(event) => event.target.select()} />
                  <div className="admin-row-actions">
                    <button className="admin-button admin-button--light admin-button--small" type="button" onClick={() => copyUrl(image.url)}><Copy size={14} /> Copy URL</button>
                    <button className="admin-icon-action" type="button" onClick={() => remove(image)} aria-label={`Delete ${image.name}`}><Trash2 size={15} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-media-empty"><ImagePlus size={21} /><span>No feature images uploaded yet.</span></div>
        )}
      </section>
    </div>
  )
}
