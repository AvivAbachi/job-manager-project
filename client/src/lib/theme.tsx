import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

type ColorMode = 'light' | 'dark'

const ThemeModeContext = createContext<{
  mode: ColorMode
  toggleMode: () => void
} | null>(null)

const storedMode = (): ColorMode =>
  localStorage.getItem('job-manager-color-mode') === 'dark' ? 'dark' : 'light'

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorMode>(storedMode)

  useEffect(() => {
    localStorage.setItem('job-manager-color-mode', mode)
  }, [mode])

  return (
    <ThemeModeContext.Provider
      value={{
        mode,
        toggleMode: () => setMode((current) => (current === 'dark' ? 'light' : 'dark')),
      }}
    >
      {children}
    </ThemeModeContext.Provider>
  )
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext)
  if (!context) throw new Error('useThemeMode must be used within ThemeModeProvider')
  return context
}
