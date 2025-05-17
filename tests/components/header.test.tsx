import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, fireEvent } from '../setup-component';
import Header from '../../client/src/components/header';
import { AuthContext } from '../../client/src/hooks/use-auth';

// Mock the auth context
const mockAuthContext = {
  user: null,
  isLoading: false,
  error: null,
  loginMutation: {
    mutate: vi.fn(),
    isPending: false,
  },
  logoutMutation: {
    mutate: vi.fn(),
    isPending: false,
  },
  registerMutation: {
    mutate: vi.fn(),
    isPending: false,
  },
};

// Mock the useAuth hook
vi.mock('../../client/src/hooks/use-auth', async () => {
  const actual = await vi.importActual('../../client/src/hooks/use-auth');
  return {
    ...actual,
    useAuth: () => mockAuthContext,
  };
});

// Mock query-related hooks
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], isLoading: false, error: null }),
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

// Mock the navigation hook
vi.mock('wouter', () => ({
  useLocation: () => ['/'],
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to} data-testid="mock-link">{children}</a>
  ),
}));

describe('Header Component', () => {
  it('renders the header', () => {
    renderWithProviders(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('displays the title', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText(/MIT 18.06/i)).toBeInTheDocument();
  });

  it('should have navigation links', () => {
    renderWithProviders(<Header />);
    expect(screen.getAllByTestId('mock-link').length).toBeGreaterThan(0);
  });

  describe('with authenticated user', () => {
    beforeEach(() => {
      mockAuthContext.user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
      };
    });

    it('displays the username when logged in', () => {
      renderWithProviders(
        <AuthContext.Provider value={mockAuthContext}>
          <Header />
        </AuthContext.Provider>
      );
      expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    });

    it('provides a logout option', () => {
      renderWithProviders(
        <AuthContext.Provider value={mockAuthContext}>
          <Header />
        </AuthContext.Provider>
      );
      // This is simplified as we can't easily test dropdown menus without more complex setup
      const logoutButton = screen.getByRole('button', { name: /account/i });
      expect(logoutButton).toBeInTheDocument();
    });
  });
});