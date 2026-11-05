import type { ReactNode } from 'react'

export const Centered = ({ children }: { children: ReactNode }) => <div className="mx-auto flex min-h-[calc(100svh-72px)] w-full max-w-[360px] flex-col justify-center pb-28 pt-12">{children}</div>

export const Column = ({ children }: { children: ReactNode }) => <div className="mx-auto min-h-[60vh] max-w-[680px] pb-20 pt-14 sm:pt-20">{children}</div>
