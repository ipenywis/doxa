import { createContext, useContext, type ReactNode } from "react"

const DemoModeContext = createContext(false)

export function DemoModeProvider({
  value,
  children,
}: {
  value: boolean
  children: ReactNode
}) {
  return (
    <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>
  )
}

export function useDemoMode() {
  return useContext(DemoModeContext)
}
