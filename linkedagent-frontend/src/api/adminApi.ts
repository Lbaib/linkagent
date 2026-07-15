async function handleApiError(response: Response, defaultMessage: string): Promise<never> {
  let errorMsg = defaultMessage;
  try {
    const errorData = await response.json();
    if (errorData && errorData.message) {
      errorMsg = errorData.message;
    }
  } catch (e) {
    // Parsing JSON failed, use default message
  }
  throw new Error(errorMsg);
}

export async function uploadDocument(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/ai/doc/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    await handleApiError(response, 'Upload failed');
  }

  return response.json();
}

export async function fetchDocuments(): Promise<any[]> {
  const response = await fetch('/api/ai/doc/list');
  if (!response.ok) {
    await handleApiError(response, 'Fetch failed');
  }
  return response.json();
}

export async function deleteDocument(name: string): Promise<any> {
  const response = await fetch(`/api/ai/doc?name=${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    await handleApiError(response, 'Delete failed');
  }
  return response.json();
}
