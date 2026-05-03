import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 30 * 1000, // 30s — cached data renders instantly on nav, refetch in background
			gcTime: 5 * 60 * 1000,
		},
	},
});