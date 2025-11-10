export default defineNuxtPlugin(async () => {
  const { checkAuth } = useAuth();
  
  // Try to restore session on app load
  await checkAuth();
});
