import type { PropsWithChildren } from 'react'
import { ThemeProvider } from '@/app/providers/ThemeProvider'

export function AppProviders({ children }: PropsWithChildren) {
  return <ThemeProvider>{children}</ThemeProvider>
}
