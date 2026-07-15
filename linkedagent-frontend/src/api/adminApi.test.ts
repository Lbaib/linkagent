import { describe, it, expect, vi, afterEach } from 'vitest';
import { uploadDocument } from './adminApi';
import * as adminApi from './adminApi';

// Mock the global fetch function
global.fetch = vi.fn();

describe('adminApi', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should upload a document successfully', async () => {
    // Arrange
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const mockResponse = { success: true, message: 'Document uploaded' };
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Act
    const result = await uploadDocument(mockFile);

    // Assert
    expect(global.fetch).toHaveBeenCalledWith('/api/ai/doc/upload', expect.any(Object));
    expect(global.fetch).toHaveBeenCalledTimes(1);
    
    // Check if body is FormData and contains the file
    const fetchCall = (global.fetch as any).mock.calls[0];
    const requestOptions = fetchCall[1];
    expect(requestOptions.method).toBe('POST');
    expect(requestOptions.body instanceof FormData).toBe(true);
    expect(requestOptions.body.get('file')).toBe(mockFile);
    
    expect(result).toEqual(mockResponse);
  });

  it('should fetch documents list', async () => {
    const mockResponse = [{ documentName: 'test.pdf', chunkCount: 5 }];
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });
    
    const result = await adminApi.fetchDocuments();
    expect(global.fetch).toHaveBeenCalledWith('/api/ai/doc/list');
    expect(result).toEqual(mockResponse);
  });

  it('should delete document', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });
    
    const result = await adminApi.deleteDocument('test.pdf');
    expect(global.fetch).toHaveBeenCalledWith('/api/ai/doc?name=test.pdf', { method: 'DELETE' });
    expect(result).toEqual({ success: true });
  });
});
