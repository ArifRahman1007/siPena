const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export async function uploadToCloudinary(file, folder = 'recruit-hub') {
  if (!file) return null

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', folder)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
    {
      method: 'POST',
      body: formData
    }
  )

  const data = await response.json()

  if (!response.ok) {
    console.error('Cloudinary upload error:', data)
    throw new Error(data?.error?.message || 'Gagal upload file ke Cloudinary')
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
    format: data.format,
    resourceType: data.resource_type,
    originalFilename: data.original_filename,
    deleteToken: data.delete_token
  }
}

export async function deleteFromCloudinary(deleteToken) {
  if (!deleteToken) return false
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/delete_by_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: deleteToken
        })
      }
    )
    const data = await response.json()
    return response.ok && data.result === 'ok'
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    return false
  }
}