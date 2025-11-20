# Registration Page

This page implements user registration for the Stockmeter application.

## Features

- **Form Validation**: Uses Zod schema validation with react-hook-form
- **Error Handling**: Displays field-level validation errors
- **Auto-login**: Automatically logs in the user after successful registration
- **Toast Notifications**: Shows success/error messages using react-hot-toast
- **Responsive Design**: Mobile-friendly layout with TailwindCSS

## Form Fields

1. **Name**: Full name (minimum 2 characters)
2. **Email**: Valid email address
3. **Password**: Minimum 6 characters
4. **Confirm Password**: Must match password field

## Validation Rules

- Name must be at least 2 characters
- Email must be a valid email format
- Password must be at least 6 characters
- Confirm password must match the password field

## User Flow

1. User fills out the registration form
2. Form is validated on submit
3. If valid, registration request is sent to backend
4. On success:
   - User is automatically logged in
   - Success toast notification is shown
   - User is redirected to home page after 1 second
5. On error:
   - Error toast notification is shown
   - User can retry registration

## Requirements Satisfied

- **Requirement 7.1**: User registration via email and password
- **Requirement 7.6**: Default Free Tier subscription status assigned on registration
- **Task 13.3**: Registration page with form validation and auto-login

## Related Files

- `/stores/auth.ts`: Auth store with register action
- `/composables/useAuth.ts`: Auth composable hook
- `/middleware.ts`: Redirects authenticated users away from this page
- `/app/layout.tsx`: Includes Toaster component for notifications
