import type { Object3D } from 'three'
/** Marcadores de POI vivos na cena (para a câmera saber onde eles estão no mundo). Chave: `${bodyId}:${poiId}` */
export const poiRegistry = new Map<string, Object3D>()

/** Direção (lat/lon → vetor unitário) no espaço do objeto; casa com UV de SphereGeometry/texturas equirretangulares. */
export function latLonToVec(latDeg: number, lonDeg: number, out: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }) {
  const la = (latDeg * Math.PI) / 180
  const lo = (lonDeg * Math.PI) / 180
  out.x = Math.cos(la) * Math.cos(lo)
  out.y = Math.sin(la)
  out.z = -Math.cos(la) * Math.sin(lo)
  return out
}
