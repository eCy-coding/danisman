import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoleGuard, AdminOnly } from './RoleGuard';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as AppStoreModule from '../../store/useAppStore';
import { type AppState } from '../../store/useAppStore';

// Mock the module
vi.mock('../../store/useAppStore', () => ({
  useAppStore: vi.fn(),
}));

describe('RoleGuard', () => {
  const useAppStoreMock = vi.mocked(AppStoreModule.useAppStore);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect if user is not authenticated', () => {
    // When useAppStore is called, return null (user)
    useAppStoreMock.mockImplementation((selector: (state: AppState) => unknown) => selector({ user: null } as AppState));

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/" element={<div>Login Page</div>} />
          <Route 
            path="/protected" 
            element={
              <RoleGuard allowedRoles={['admin']} fallback={<div>Login Page</div>}>
                <div>Protected Content</div>
              </RoleGuard>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeDefined();
  });

  it('should redirect if user role is not allowed', () => {
    // Mock user with client role
    useAppStoreMock.mockImplementation((selector: (state: AppState) => unknown) => selector({ user: { role: 'client' } } as AppState));

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route 
            path="/protected" 
            element={
              <RoleGuard allowedRoles={['admin']} fallback={<div>Home Page</div>}>
                <div>Protected Content</div>
              </RoleGuard>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home Page')).toBeDefined();
  });

  it('should render children if user role is allowed', () => {
    useAppStoreMock.mockImplementation((selector: (state: AppState) => unknown) => selector({ user: { role: 'admin' } } as AppState));

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <RoleGuard allowedRoles={['admin']} fallback={<div>Home Page</div>}>
          <div>Protected Content</div>
        </RoleGuard>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeDefined();
  });

  it('AdminOnly should allow admins', () => {
    useAppStoreMock.mockImplementation((selector: (state: AppState) => unknown) => selector({ user: { role: 'admin' } } as AppState));
     render(
      <MemoryRouter>
        <AdminOnly>
          <div>Admin Content</div>
        </AdminOnly>
      </MemoryRouter>
    );
    expect(screen.getByText('Admin Content')).toBeDefined();
  });

   it('AdminOnly should block clients', () => {
    useAppStoreMock.mockImplementation((selector: (state: AppState) => unknown) => selector({ user: { role: 'client' } } as AppState));
     render(
      <MemoryRouter initialEntries={['/admin']}>
         <Routes>
            <Route path="/" element={<div>Fallback</div>} />
             <Route path="/admin" element={
                  <AdminOnly fallback={<div>Fallback</div>}>
                     <div>Admin Content</div>
                   </AdminOnly>
             } />
         </Routes>
      </MemoryRouter>
    );
    expect(screen.queryByText('Admin Content')).toBeNull();
    expect(screen.getByText('Fallback')).toBeDefined();
  });
});
