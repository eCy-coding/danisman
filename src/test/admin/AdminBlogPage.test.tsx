/**
 * P0-1: Blog Create Stub → Real API
 * Failing tests — alert() must be replaced with POST /api/admin/blog + toast feedback.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AdminBlogPage } from '../../pages/admin/AdminBlogPage';

// Mock apiClient — controls what POST /admin/blog returns
vi.mock('../../lib/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: { data: { items: [] } } }),
    post: vi.fn().mockResolvedValue({ data: { status: 'success', data: { slug: 'test-slug' } } }),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminBlogPage — P0-1 Blog Create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on window.alert — should NOT be called after fix
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('should NOT call alert() on form submit', async () => {
    wrap(<AdminBlogPage />);

    // Open create form
    const newPostBtn = screen.getByRole('button', { name: /new post/i });
    await userEvent.click(newPostBtn);

    // Fill title
    const titleInput = screen.getByLabelText(/post title/i);
    await userEvent.type(titleInput, 'Test Blog Başlığı');

    // Submit
    const createBtn = screen.getByRole('button', { name: /create post/i });
    await userEvent.click(createBtn);

    // alert() must NOT be called
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('should POST to /api/admin/blog with slug and title on submit', async () => {
    const { apiClient } = await import('../../lib/api');
    wrap(<AdminBlogPage />);

    const newPostBtn = screen.getByRole('button', { name: /new post/i });
    await userEvent.click(newPostBtn);

    const titleInput = screen.getByLabelText(/post title/i);
    await userEvent.type(titleInput, 'Test Blog Başlığı');

    const createBtn = screen.getByRole('button', { name: /create post/i });
    await userEvent.click(createBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/admin/blog',
        expect.objectContaining({ slug: expect.any(String), title: 'Test Blog Başlığı' }),
      );
    });
  });

  it('should show success toast on API 201', async () => {
    const { toast } = await import('sonner');
    wrap(<AdminBlogPage />);

    const newPostBtn = screen.getByRole('button', { name: /new post/i });
    await userEvent.click(newPostBtn);

    const titleInput = screen.getByLabelText(/post title/i);
    await userEvent.type(titleInput, 'Test Blog Başlığı');

    const createBtn = screen.getByRole('button', { name: /create post/i });
    await userEvent.click(createBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/yazınız oluşturuldu|kaydedildi/i),
      );
    });
  });

  it('should show error toast on API 500 and preserve form values', async () => {
    const { apiClient } = await import('../../lib/api');
    const { toast } = await import('sonner');

    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Server Error'));

    wrap(<AdminBlogPage />);

    const newPostBtn = screen.getByRole('button', { name: /new post/i });
    await userEvent.click(newPostBtn);

    const titleInput = screen.getByLabelText(/post title/i);
    await userEvent.type(titleInput, 'Test Blog Başlığı');

    const createBtn = screen.getByRole('button', { name: /create post/i });
    await userEvent.click(createBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/kaydedilemedi|tekrar deneyin/i),
      );
    });

    // Form must still be visible after error (not cleared)
    expect(screen.getByDisplayValue('Test Blog Başlığı')).toBeTruthy();
  });
});
