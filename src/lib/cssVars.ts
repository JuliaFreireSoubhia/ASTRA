import type { CSSProperties } from 'react'
/** Tipagem segura para custom properties inline: style={cv({ '--i': 2 })} */
export const cv = (vars: Record<string, string | number>) => vars as CSSProperties
