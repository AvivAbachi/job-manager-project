import { Button } from '@astryxdesign/core/Button'
import { useThemeMode } from '../lib/theme'

export function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode()
  return (
    <Button
      label={mode === 'dark' ? 'Light mode' : 'Dark mode'}
      variant="secondary"
      size="sm"
      onClick={toggleMode}
    />
  )
}
