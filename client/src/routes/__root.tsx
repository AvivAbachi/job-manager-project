import { LinkProvider } from '@astryxdesign/core/Link'
import { Theme } from '@astryxdesign/core/theme'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { FormDevtoolsPanel } from '@tanstack/react-form-devtools'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TableDevtoolsPanel } from '@tanstack/react-table-devtools'
import { useEffect } from 'react'
import '../styles.css'
import { setUnauthorizedHandler } from '../lib/api'
import { clearProtectedQueries, queryClient } from '../lib/query'
import { ThemeModeProvider, useThemeMode } from '../lib/theme'

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
    <ThemeModeProvider>
      <ThemedApp />
    </ThemeModeProvider>
  )
}

function ThemedApp() {
  const { mode } = useThemeMode()
  return (
    <Theme theme={neutralTheme} mode={mode}>
      <LinkProvider
        component={({ href, ...props }) => <Link to={href ?? '/'} {...props} />}
      >
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
              {
                name: 'TanStack Form',
                render: <FormDevtoolsPanel />,
              },
              {
                name: 'TanStack Query',
                render: <ReactQueryDevtoolsPanel />,
              },
              {
                name: 'TanStack Table',
                render: <TableDevtoolsPanel />,
              },
            ]}
          />
        </QueryClientProvider>
      </LinkProvider>
    </Theme>
  )
}
