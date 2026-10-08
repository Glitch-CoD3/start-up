import { useRef, useState } from 'react'
import { ImagePlus, LoaderCircle, X } from 'lucide-react'
import { PRODUCT_IMAGE_FOLDER, uploadImage } from '../storage'

export default function ImageUploader({ images, onChange, folder = PRODUCT_IMAGE_FOLDER }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const uploadFiles = async (event) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!files.length) return

    setUploading(true)
    setError('')
    const uploaded = []
    try {
      for (const file of files) {
        uploaded.push(await uploadImage(file, folder))
      }
      onChange([...images, ...uploaded.map((image) => image.url)])
    } catch (cause) {
      if (uploaded.length) onChange([...images, ...uploaded.map((image) => image.url)])
      setError(cause.message || 'Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="admin-image-uploader">
      <input
        ref={inputRef}
        className="admin-image-uploader__input"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        multiple
        onChange={uploadFiles}
        disabled={uploading}
        aria-label="Choose images to upload"
      />
      <button className="admin-button admin-button--small" type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? <LoaderCircle className="admin-spinner" size={15} /> : <ImagePlus size={15} />}
        {uploading ? 'Uploading…' : 'Upload images'}
      </button>
      <span className="admin-upload-hint">JPG, PNG, WebP, AVIF, or GIF · Up to 10 MB each · Saved to {folder}/</span>
      {error && <p className="admin-upload-error" role="alert">{error}</p>}
      {images.length > 0 && (
        <div className="admin-image-list">
          {images.map((image, index) => (
            <div className="admin-image-preview" key={`${image}-${index}`}>
              <img src={image} alt={`Product image ${index + 1}`} />
              <button
                type="button"
                onClick={() => onChange(images.filter((_, imageIndex) => imageIndex !== index))}
                aria-label={`Remove image ${index + 1}`}
              ><X size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}