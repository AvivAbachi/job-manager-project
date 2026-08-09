import { useEffect } from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'

import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import '../styles.css'
import { setUnauthorizedHandler } from '../lib/api'
import { clearProtectedQueries, queryClient } from '../lib/query'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  useEffect(
    () =>
      setUnauthorizedHandler(() => {
        clearProtectedQueries()
        const redirect = `${window.location.pathname}${window.location.search}`
        window.location.assign(
          `/sign-in?redirect=${encodeURIComponent(redirect)}`,
        )
      }),
    [],
  )
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </QueryClientProvider>
  )
}
