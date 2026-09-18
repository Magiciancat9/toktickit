import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { UserManagement } from '../../src/components/UserManagement.js';
import * as api from '../../src/api.js';
import * as AuthContext from '../../src/context/AuthContext.js';

// Mock the API module
vi.mock('../../src/api.js', () => ({
  fetchAdminUsers: vi.fn(),
  createAdminUser: vi.fn(),
  updateAdminUser: vi.fn(),
  resetAdminUserPassword: vi.fn(),
}));

// Mock the AuthContext
vi.mock('../../src/context/AuthContext.js', () => ({
  useAuth: vi.fn(),
}));

const mockAdminUser = {
  id: 1,
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'ADMINISTRATOR',
  isActive: true,
  requiresPasswordChange: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const mockStaffUser = {
  id: 2,
  name: 'Staff User',
  email: 'staff@example.com',
  role: 'IT_STAFF',
  isActive: true,
  requiresPasswordChange: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('UserManagement Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default auth mock setup
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: mockAdminUser,
      login: vi.fn(),
      logout: vi.fn(),
      loading: false
    } as any);
  });

  it('renders loading state initially', () => {
    vi.mocked(api.fetchAdminUsers).mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<UserManagement />);
    
    expect(screen.getByText(/Loading users/i)).toBeInTheDocument();
  });

  it('renders users list successfully', async () => {
    vi.mocked(api.fetchAdminUsers).mockResolvedValue([mockAdminUser, mockStaffUser]);
    
    render(<UserManagement />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/Loading users/i)).not.toBeInTheDocument();
    });

    // Check if users are displayed (use getAllByText because desktop and mobile views both render the text)
    expect(screen.getAllByText('Admin User')[0]).toBeInTheDocument();
    expect(screen.getAllByText('admin@example.com')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Staff User')[0]).toBeInTheDocument();
    expect(screen.getAllByText('staff@example.com')[0]).toBeInTheDocument();
  });

  it('handles API error state', async () => {
    vi.mocked(api.fetchAdminUsers).mockRejectedValue(new Error('Failed to fetch'));
    
    render(<UserManagement />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
    });
  });

  it('opens create modal on button click', async () => {
    vi.mocked(api.fetchAdminUsers).mockResolvedValue([]);
    render(<UserManagement />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading users/i)).not.toBeInTheDocument();
    });

    const createBtn = screen.getByText('+ Create User');
    fireEvent.click(createBtn);

    expect(screen.getByText('Create New User')).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
  });

  it('creates user successfully', async () => {
    vi.mocked(api.fetchAdminUsers).mockResolvedValue([]);
    vi.mocked(api.createAdminUser).mockResolvedValue(mockStaffUser);
    
    render(<UserManagement />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading users/i)).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Create User'));

    // Fill form
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'new@test.com' } });
    fireEvent.change(screen.getByLabelText(/Initial Password/i), { target: { value: 'TestPass1!' } });

    // Submit
    fireEvent.click(screen.getByText('Save User'));

    await waitFor(() => {
      expect(api.createAdminUser).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New User',
        email: 'new@test.com',
        initialPassword: 'TestPass1!'
      }));
    });
    
    // Ensure fetch is called again after create
    expect(api.fetchAdminUsers).toHaveBeenCalledTimes(2);
  });

  it('handles duplicate email during creation', async () => {
    vi.mocked(api.fetchAdminUsers).mockResolvedValue([]);
    const conflictError = new Error('Conflict');
    (conflictError as any).status = 409;
    vi.mocked(api.createAdminUser).mockRejectedValue(conflictError);
    
    render(<UserManagement />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading users/i)).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Create User'));
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'new@test.com' } });
    fireEvent.change(screen.getByLabelText(/Initial Password/i), { target: { value: 'TestPass1!' } });
    fireEvent.click(screen.getByText('Save User'));

    await waitFor(() => {
      expect(screen.getByText(/A user with this email already exists/i)).toBeInTheDocument();
    });
  });

});
