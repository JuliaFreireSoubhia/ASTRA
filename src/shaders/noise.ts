/** Ruído 3D (value noise) + fBm. Requer `#define OCTAVES n` no material. Em coordenadas de objeto: sem emendas/UV. */
export const NOISE_GLSL = /* glsl */ `
float hash31(vec3 p){
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float vnoise(vec3 x){
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash31(i + vec3(0,0,0)), hash31(i + vec3(1,0,0)), f.x),
        mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
        mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y),
    f.z);
}
float fbm(vec3 p){
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < OCTAVES; i++) {
    s += a * vnoise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  // normaliza p/ [0,1] independente do nº de oitavas (qualidade low/high parecem iguais)
  return s / (1.0 - pow(0.5, float(OCTAVES)));
}
`
