import { Vector3 } from 'three'
/** Estado compartilhado do buraco negro → efeito de lente (pós-processamento). Escrito pela cena, lido por Effects. */
export const lensState = { target: 0, pos: new Vector3(), radius: 1 }
