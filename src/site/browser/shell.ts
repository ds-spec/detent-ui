'use client'

import { createContext, useContext } from 'react'

export type Shell = { present: boolean; setPresent: (v: boolean) => void; inspect: boolean; setInspect: (v: boolean | ((v: boolean) => boolean)) => void; dir: number }
export const ShellContext = createContext<Shell>({ present: false, setPresent: () => {}, inspect: false, setInspect: () => {}, dir: 1 })
export const useShell = () => useContext(ShellContext)

