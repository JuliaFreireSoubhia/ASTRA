/** Perfil radial dos anéis de Saturno (r = 0 borda interna do anel C … 1 borda externa do anel A). Usado nos anéis E na sombra projetada no planeta. */
export const RING_GLSL = /* glsl */ `
float rh(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float ringAlpha(float r){
  float a = 0.0;
  a += smoothstep(0.0, 0.03, r) * (1.0 - smoothstep(0.27, 0.29, r)) * 0.2;          // anel C (tênue)
  a += smoothstep(0.27, 0.31, r) * (1.0 - smoothstep(0.68, 0.70, r)) * 0.9;         // anel B (denso)
  a += smoothstep(0.69, 0.72, r) * (1.0 - smoothstep(0.72, 0.76, r)) * 0.05;        // divisão de Cassini
  a += smoothstep(0.76, 0.785, r) * (1.0 - smoothstep(0.985, 1.0, r)) * 0.62;       // anel A
  a *= 1.0 - 0.92 * (1.0 - smoothstep(0.0, 0.007, abs(r - 0.947)));                 // divisão de Encke
  a *= 0.78 + 0.22 * rh(floor(r * 420.0));                                           // anelzinhos finos
  a *= 0.85 + 0.15 * sin(r * 210.0);
  return clamp(a, 0.0, 1.0);
}
`
