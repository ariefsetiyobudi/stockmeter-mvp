export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated } = useAuth();

  // If user is not authenticated, redirect to login
  if (!isAuthenticated.value) {
    return navigateTo('/login');
  }
});
