import { NOISE_GLSL } from './noise'

export const nebulaVertex = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

/** Rodado UMA vez num cubemap (ver Nebula em scenes/Starfield.tsx): custo por frame ≈ zero. */
export const nebulaFragment = /* glsl */ `
varying vec3 vDir;
${NOISE_GLSL}
void main(){
  vec3 d = normalize(vDir);
  float n1 = fbm(d * 2.4 + vec3(3.1, 1.7, 8.2));
  float n2 = fbm(d * 4.2 + n1 * 1.8 + vec3(11.0));
  float n3 = fbm(d * 7.5 + n2 * 1.2);

  vec3 deep   = vec3(0.004, 0.008, 0.022);
  vec3 blue   = vec3(0.04, 0.10, 0.26);
  vec3 violet = vec3(0.14, 0.06, 0.24);

  float cloud = smoothstep(0.50, 0.90, n2);
  vec3 col = deep * (0.6 + n1);
  col += mix(blue, violet, smoothstep(0.3, 0.8, n1)) * cloud * (0.25 + 0.75 * n3) * 0.5;

  // faixa estilo Via Láctea, bem sutil, com faixas de poeira escura
  float lat = dot(d, normalize(vec3(0.35, 0.9, 0.25)));
  float band = exp(-lat * lat * 18.0);
  col += vec3(0.09, 0.10, 0.14) * band * (0.25 + 1.1 * fbm(d * 9.0 + 4.0));
  col *= 1.0 - 0.6 * band * smoothstep(0.55, 0.8, fbm(d * 14.0 + 2.0));

  gl_FragColor = vec4(col, 1.0);
}
`
