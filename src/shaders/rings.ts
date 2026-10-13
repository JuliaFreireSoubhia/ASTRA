import { RING_GLSL } from './ringProfile'

export const ringsVertex = /* glsl */ `
varying vec3 vPos;
varying vec3 vW;
void main(){
  vPos = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

export const ringsFragment = /* glsl */ `
uniform float uInner;
uniform float uOuter;
uniform float uPlanetR;
uniform vec3 uColor;
uniform vec3 uSunPos;
uniform vec3 uPlanetPos;
uniform vec3 uAxis;
varying vec3 vPos;
varying vec3 vW;
${RING_GLSL}
void main(){
  float r = (length(vPos.xy) - uInner) / (uOuter - uInner);
  float a = ringAlpha(r);
  vec3 L = normalize(uSunPos - vW);
  vec3 V = normalize(cameraPosition - vW);

  // sombra do planeta sobre os anéis (penumbra suave)
  float t = dot(uPlanetPos - vW, L);
  float shadow = 1.0;
  if (t > 0.0) {
    float d = length(uPlanetPos - (vW + L * t));
    shadow = smoothstep(uPlanetR * 0.97, uPlanetR * 1.06, d);
  }
  // lado não iluminado do anel: só luz transmitida
  float lit = (sign(dot(L, uAxis)) == sign(dot(V, uAxis))) ? 1.0 : 0.3;

  vec3 base = mix(vec3(0.40, 0.35, 0.29), uColor, smoothstep(0.0, 0.4, r));
  base = mix(base, uColor * 1.12, smoothstep(0.28, 0.5, r) * (1.0 - smoothstep(0.68, 0.72, r)));
  float n = rh(floor(r * 300.0));
  vec3 col = base * (0.75 + 0.35 * n) * lit * (0.06 + 0.94 * shadow);
  gl_FragColor = vec4(col, a * 0.95);
  #include <colorspace_fragment>
}
`
