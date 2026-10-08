import { requireSupabase } from '../../lib/supabase'
import {
  FEATURE_IMAGE_FOLDER,
  IMAGE_BUCKET,
  listPublicImages,
  MAX_IMAGE_SIZE,
  PRODUCT_IMAGE_FOLDER,
} from '../../lib/storageImages'

export { FEATURE_IMAGE_FOLDER, IMAGE_BUCKET, MAX_IMAGE_SIZE, PRODUCT_IMAGE_FOLDER }

const ALLOWED_IMAGE_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
])
const IMAGE_EXTENSIONS = new Map([
  ['image/avif', 'avif'],
  ['image/gif', 'gif'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

function validateImage(file) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error(`${file.name}: choose a JPG, PNG, WebP, AVIF, or GIF image.`)
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`${file.name}: image must be 10 MB or smaller.`)
  }
}

export async function uploadImage(file, folder) {
  validateImage(file)
  if (![PRODUCT_IMAGE_FOLDER, FEATURE_IMAGE_FOLDER].includes(folder)) {
    throw new Error('Invalid image destination.')
  }

  const extension = IMAGE_EXTENSIONS.get(file.type)
  const path = `${folder}/${crypto.randomUUID()}.${extension}`
  const client = await requireSupabase()
  const { error } = await client.storage.from(IMAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error

  const { data } = client.storage.from(IMAGE_BUCKET).getPublicUrl(path)
  if (!data?.publicUrl) throw new Error('The image uploaded, but its public URL could not be created.')
  return { path, url: data.publicUrl }
}

export async function listImages(folder) {
  return listPublicImages(folder)
}

export async function getHomepageFeatureImage() {
  const client = await requireSupabase()
  const { data, error } = await client.rpc('get_homepage_feature_image')
  if (error) throw error
  return data
}

export async function setHomepageFeatureImage(path) {
  if (path && !path.startsWith(`${FEATURE_IMAGE_FOLDER}/`)) {
    throw new Error('Choose an image from the feature-images folder.')
  }
  const client = await requireSupabase()
  const { data, error } = await client.rpc('update_homepage_feature_image', {
    p_image_path: path,
  })
  if (error) throw error
  return data
}

export async function deleteImage(path, folder) {
  if (![PRODUCT_IMAGE_FOLDER, FEATURE_IMAGE_FOLDER].includes(folder) || !path.startsWith(`${folder}/`)) {
    throw new Error('Invalid image path.')
  }
  const client = await requireSupabase()
  const { error } = await client.storage.from(IMAGE_BUCKET).remove([path])
  if (error) throw error
}

export async function deleteUnusedProductImages(imageUrls) {
  const urls = [...new Set(imageUrls)]
  if (!urls.length) return

  const client = await requireSupabase()
  const { data: references, error: lookupError } = await client
    .from('variant_images')
    .select('image_url')
    .in('image_url', urls)
    .is('deleted_at', null)
  if (lookupError) throw lookupError

  const stillReferenced = new Set((references ?? []).map((reference) => reference.image_url))
  const candidateUrls = urls.filter((url) => !stillReferenced.has(url))
  const publicUrl = client.storage
    .from(IMAGE_BUCKET)
    .getPublicUrl(`${PRODUCT_IMAGE_FOLDER}/__url_check__`).data.publicUrl
  const expectedUrl = new URL(publicUrl)
  const expectedPathPrefix =
    expectedUrl.pathname.slice(0, expectedUrl.pathname.lastIndexOf(`${PRODUCT_IMAGE_FOLDER}/`)) +
    `${PRODUCT_IMAGE_FOLDER}/`
  const objectPaths = []
  for (const imageUrl of candidateUrls) {
    let image
    try {
      image = new URL(imageUrl)
    } catch {
      continue
    }
    if (image.origin !== expectedUrl.origin || !image.pathname.startsWith(expectedPathPrefix)) continue
    let path
    try {
      path = `${PRODUCT_IMAGE_FOLDER}/${decodeURIComponent(image.pathname.slice(expectedPathPrefix.length))}`
    } catch {
      continue
    }
    if (!path.split('/').includes('..')) objectPaths.push(path)
  }

  if (!objectPaths.length) return
  const { error } = await client.storage.from(IMAGE_BUCKET).remove(objectPaths)
  if (error) throw error
}
