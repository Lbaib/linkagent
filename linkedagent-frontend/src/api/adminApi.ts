export async function uploadDocument(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/ai/doc/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
}

export async function fetchDocuments(): Promise<any[]> {
  const response = await fetch('/api/ai/doc/list');
  if (!response.ok) throw new Error('Fetch failed');
  return response.json();
}

export async function deleteDocument(name: string): Promise<any> {
  const response = await fetch(`/api/ai/doc?name=${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Delete failed');
  return response.json();
}
