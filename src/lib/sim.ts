/**
 * Relógio da simulação. É um objeto mutável de propósito: lido a cada frame por
 * planetas, câmera e shaders sem causar re-render do React.
 * Avança em SimClock (prioridade negativa) → todos veem o mesmo `t` no frame.
 */
export const sim = { t: 0 }
