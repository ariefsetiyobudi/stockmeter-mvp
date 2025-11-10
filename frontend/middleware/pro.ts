export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated, isPro } = useAuth();

  // If user is not authenticated, redirect to login
  if (!isAuthenticated.value) {
    return navigateTo('/login');
  }

  // If user is not Pro, redirect to pricing page
  if (!isPro.value) {
    return navigateTo('/pricing');
  }
});
