import { requireSupabase } from './supabase'

export const IMAGE_BUCKET = 'e-commerce'
export const PRODUCT_IMAGE_FOLDER = 'product-images'
export const FEATURE_IMAGE_FOLDER = 'feature-images'
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024

export async function listPublicImages(folder) {
  if (![PRODUCT_IMAGE_FOLDER, FEATURE_IMAGE_FOLDER].includes(folder)) {
    throw new Error('Invalid image destination.')
  }

  const client = await requireSupabase()
  const { data, error } = await client.storage.from(IMAGE_BUCKET).list(folder, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' },
  })
  if (error) throw error

  return (data ?? [])
    .filter((entry) => entry.id && entry.name !== '.emptyFolderPlaceholder')
    .map((entry) => {
      const path = `${folder}/${entry.name}`
      const { data: publicData } = client.storage.from(IMAGE_BUCKET).getPublicUrl(path)
      return { ...entry, path, url: publicData.publicUrl }
    })
}
