
/**
 * Uploads a file to the server which then uploads to Cloudinary
 * @param file The file to upload
 * @returns The secure URL of the uploaded file
 */
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload file');
  }

  const data = await response.json();
  return data.url;
}

/**
 * Uploads multiple files
 * @param files Array of files to upload
 * @returns Array of secure URLs
 */
export async function uploadFiles(files: File[]): Promise<string[]> {
  const uploadPromises = files.map(file => uploadFile(file));
  return Promise.all(uploadPromises);
}

