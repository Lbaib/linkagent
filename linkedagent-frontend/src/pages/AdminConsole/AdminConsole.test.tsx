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
      expect(screen.getByText(/15 chunks/i)).toBeInTheDocument();
    });
  });
});
