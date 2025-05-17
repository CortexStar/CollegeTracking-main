import { createContext, ReactNode, useContext } from "react";

// Define a simple anonymous user structure
const anonymousUser = {
  id: "anonymous-user",
  username: "Guest",
  name: "Guest User",
  createdAt: new Date(),
};

type AuthContextType = {
  // Always returns the anonymous user
  user: typeof anonymousUser;
  // These state indicators are always in a "complete" state
  isLoading: false;
  error: null;
  
  // These mutations do nothing in guest mode
  loginMutation: { 
    mutate: () => ({}), 
    isPending: false 
  };
  registerMutation: { 
    mutate: () => ({}), 
    isPending: false 
  };
  logoutMutation: { 
    mutate: () => ({}), 
    isPending: false 
  };
};

// Create a context with default values
export const AuthContext = createContext<AuthContextType>({
  user: anonymousUser,
  isLoading: false,
  error: null,
  loginMutation: { mutate: () => ({}), isPending: false },
  registerMutation: { mutate: () => ({}), isPending: false },
  logoutMutation: { mutate: () => ({}), isPending: false }
});

/**
 * AuthProvider component
 * This simplified version always provides an anonymous user
 * with authentication permanently disabled
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Simply provide the default context value
  return (
    <AuthContext.Provider
      value={{
        user: anonymousUser,
        isLoading: false,
        error: null,
        loginMutation: { mutate: () => ({}), isPending: false },
        registerMutation: { mutate: () => ({}), isPending: false },
        logoutMutation: { mutate: () => ({}), isPending: false }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth hook that provides access to the simplified auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}