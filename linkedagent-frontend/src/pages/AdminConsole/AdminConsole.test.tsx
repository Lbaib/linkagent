import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminConsole from './AdminConsole';
import * as adminApi from '../../api/adminApi';

vi.mock('../../api/adminApi');

describe('AdminConsole', () => {
  beforeEach(() => {
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('should upload document and show success message', async () => {
    // Arrange
    const mockUpload = vi.spyOn(adminApi, 'uploadDocument').mockResolvedValue({
      success: true,
      message: 'Upload successful'
    });
    vi.spyOn(adminApi, 'fetchDocuments').mockResolvedValue([]);
    
    render(<AdminConsole />);
    
    // Check initial state
    expect(screen.getByRole('heading', { name: /Knowledge Base/i })).toBeInTheDocument();
    
    // Select file (this triggers auto-upload)
    const fileInput = screen.getByLabelText(/upload document/i) as HTMLInputElement;
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Assert API call
    expect(mockUpload).toHaveBeenCalledWith(file);
    
    // Assert success message is displayed
    await waitFor(() => {
      expect(screen.getByText('Upload successful')).toBeInTheDocument();
    });
  });

  it('should fetch and display document list', async () => {
    vi.spyOn(adminApi, 'fetchDocuments').mockResolvedValue([
      { documentName: 'test-doc.pdf', chunkCount: 15 }
    ]);
    
    render(<AdminConsole />);
    
    await waitFor(() => {
      expect(screen.getByText('test-doc.pdf')).toBeInTheDocument();
      expect(screen.getByText(/15 个切片/i)).toBeInTheDocument();
    });
  });

  it('should fetch and display chunk preview modal when preview clicked', async () => {
    vi.spyOn(adminApi, 'fetchDocuments').mockResolvedValue([
      { documentName: 'test-doc.pdf', chunkCount: 2 }
    ]);
    const mockFetchChunks = vi.spyOn(adminApi, 'fetchDocumentChunks').mockResolvedValue([
      { id: 1, documentName: 'test-doc.pdf', content: 'First chunk preview', chunkIndex: 0 },
      { id: 2, documentName: 'test-doc.pdf', content: 'Second chunk preview', chunkIndex: 1 }
    ]);

    render(<AdminConsole />);

    await waitFor(() => {
      expect(screen.getByText('test-doc.pdf')).toBeInTheDocument();
    });

    const previewButton = screen.getByLabelText(/Preview chunks for test-doc\.pdf/i);
    fireEvent.click(previewButton);

    expect(mockFetchChunks).toHaveBeenCalledWith('test-doc.pdf');

    await waitFor(() => {
      expect(screen.getByText('First chunk preview')).toBeInTheDocument();
      expect(screen.getByText('Second chunk preview')).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByLabelText(/Close modal/i);
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('First chunk preview')).not.toBeInTheDocument();
    });
  });
});
