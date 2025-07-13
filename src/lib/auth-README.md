# Authentication System

This file contains the centralized authentication logic for the FlipSheet application. All authentication-related functionality has been consolidated here from various components throughout the app.

## Features

### Core Functions

- **`isAuthenticated()`** - Check if user is authenticated
- **`getCurrentUser()`** - Get current user information
- **`signUp(data)`** - Sign up a new user
- **`signIn(data)`** - Sign in an existing user
- **`signOut()`** - Sign out the current user
- **`getSession()`** - Get current session information

### State Management

- **`subscribeToAuthChanges(callback)`** - Subscribe to authentication state changes
- **`initializeAuth()`** - Initialize authentication listeners
- **`getCachedUser()`** - Get cached user information

### Validation

- **`validateSignUpData(data)`** - Validate signup form data
- **`validateSignInData(data)`** - Validate signin form data

## Types

```typescript
interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
}

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

interface SignInData {
  email: string;
  password: string;
}

interface AuthError {
  message: string;
}
```

## Usage Examples

### Basic Authentication Check
```typescript
import { isAuthenticated } from '@/lib/auth';

const checkAuth = async () => {
  const authenticated = await isAuthenticated();
  console.log('User is authenticated:', authenticated);
};
```

### Sign Up
```typescript
import { signUp } from '@/lib/auth';

const handleSignUp = async () => {
  const { user, error } = await signUp({
    email: 'user@example.com',
    password: 'password123',
    fullName: 'John Doe'
  });
  
  if (error) {
    console.error('Sign up failed:', error.message);
  } else {
    console.log('User signed up:', user);
  }
};
```

### Sign In
```typescript
import { signIn } from '@/lib/auth';

const handleSignIn = async () => {
  const { user, error } = await signIn({
    email: 'user@example.com',
    password: 'password123'
  });
  
  if (error) {
    console.error('Sign in failed:', error.message);
  } else {
    console.log('User signed in:', user);
  }
};
```

### Using the useAuth Hook
```typescript
import { useAuth } from '@/lib/useAuth';

function MyComponent() {
  const { user, isAuthenticated, isLoading, signIn, signUp, signOut } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.full_name}!</p>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <div>
          <button onClick={() => signIn({ email: 'test@example.com', password: 'password' })}>
            Sign In
          </button>
        </div>
      )}
    </div>
  );
}
```

## Migration Notes

The following components have been updated to use the centralized auth system:

1. **Header.tsx** - Now uses `useAuth` hook
2. **SignUpModal.tsx** - Uses centralized `signUp` and validation
3. **LoginModal.tsx** - Uses centralized `signIn` and validation
4. **signup_page/page.tsx** - Uses centralized `signUp` and validation
5. **property_page/page.tsx** - Uses centralized `getSession`
6. **database.ts** - Updated to use centralized auth functions
7. **database.test.ts** - Updated to use centralized auth functions

## Benefits

1. **Centralized Logic** - All authentication logic is now in one place
2. **Consistent Error Handling** - Standardized error messages and handling
3. **Type Safety** - Full TypeScript support with proper interfaces
4. **State Management** - Automatic auth state synchronization across components
5. **Validation** - Centralized form validation
6. **Testing** - Easier to test authentication logic
7. **Maintainability** - Changes to auth logic only need to be made in one place

## Initialization

The authentication system is automatically initialized when the app starts via the `AuthProvider` component in the root layout. 