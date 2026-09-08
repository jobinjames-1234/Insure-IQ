import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getRouterForSubdomain } from './router';
import { getSubdomain } from './utils/subdomain';

const queryClient = new QueryClient();

function App() {
  const subdomain = getSubdomain();
  const router = getRouterForSubdomain(subdomain);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
