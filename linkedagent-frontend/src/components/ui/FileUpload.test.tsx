import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FileUpload from './FileUpload';

describe('FileUpload component', () => {
  it('should call onFileSelected when a file is selected', () => {
    const handleFileSelected = vi.fn();
    render(<FileUpload onFileSelected={handleFileSelected} />);

    // Find the file input
    const input = screen.getByLabelText(/upload/i) as HTMLInputElement;
    expect(input).toBeInTheDocument();

    // Create a mock file
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });

    // Simulate file selection
    fireEvent.change(input, { target: { files: [file] } });

    // Verify callback is called
    expect(handleFileSelected).toHaveBeenCalledTimes(1);
    expect(handleFileSelected).toHaveBeenCalledWith(file);
  });
});
