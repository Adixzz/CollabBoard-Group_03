import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';
import { AuthContext } from '../../context/AuthContext';

describe('Login Page Component', () => {
  const mockAuthContext = {
    user: null,
    loading: false,
    login: vi.fn().mockResolvedValue({ success: true }),
    logout: vi.fn(),
    register: vi.fn(),
  };

  const renderLogin = (authOverrides = {}) => {
    return render(
      <AuthContext.Provider value={{ ...mockAuthContext, ...authOverrides }}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('should render login form elements correctly', () => {
    renderLogin();

    expect(screen.getByText('Welcome to CollabBoard')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText('Register now')).toBeInTheDocument();
  });

  it('should display error message on failed login attempt', async () => {
    const mockFailedLogin = vi.fn().mockResolvedValue({
      success: false,
      message: 'Invalid credentials provided',
    });

    renderLogin({ login: mockFailedLogin });

    fireEvent.change(screen.getByPlaceholderText('Enter your username'), {
      target: { value: 'Sandev' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'wrongpass' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    const errorMsg = await screen.findByText('Invalid credentials provided');
    expect(errorMsg).toBeInTheDocument();
  });
});
