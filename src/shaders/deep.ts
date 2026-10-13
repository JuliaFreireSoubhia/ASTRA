import { NOISE_GLSL } from './noise'

/* ---------- Estrelas da galáxia (Points). Tamanho em px ~ aSize*uRef/dist, limitado → LOD natural ---------- */
export const galaxyVertex = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
attribute float aBright;
uniform float uPx;
uniform float uRef;
varying vec3 vC;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float px = aSize * uPx * uRef / max(-mv.z, 1.0);
  gl_PointSize = clamp(px, 1.0 * uPx, 11.0 * uPx);
  vC = aColor * aBright * clamp(px / uPx, 0.4, 1.0);
}
`
export const galaxyFragment = /* glsl */ `
varying vec3 vC;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = pow(smoothstep(0.5, 0.0, d), 2.0);
  gl_FragColor = vec4(vC, a);
  #include <colorspace_fragment>
}
`

/* ---------- Poeira escura (normal blending: escurece as estrelas atrás) ---------- */
export const dustFragment = /* glsl */ `
varying vec3 vC;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = exp(-d * d * 3.0) * (1.0 - smoothstep(0.85, 1.0, d));
  gl_FragColor = vec4(vC, a * 0.22);
  #include <colorspace_fragment>
}
`

/* ---------- Nuvens de gás (nebulosa): sprites grandes, gaussianos, aditivos ---------- */
export const puffVertex = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
attribute float aAlpha;
uniform float uPx;
uniform float uRef;
uniform float uMax;
varying vec3 vC;
varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float px = aSize * uPx * uRef / max(-mv.z, 1.0);
  gl_PointSize = clamp(px, 2.0 * uPx, uMax * uPx);
  float k = min(1.0, gl_PointSize / max(px, 0.001));
  vC = aColor;
  vA = aAlpha * k * k;
}
`
export const puffFragment = /* glsl */ `
varying vec3 vC;
varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = exp(-d * d * 3.5) * (1.0 - smoothstep(0.8, 1.0, d));
  gl_FragColor = vec4(vC, a * vA);
  #include <colorspace_fragment>
}
`

/* ---------- Brilho radial (billboard): núcleo da galáxia, halo de estrelas ---------- */
export const glowVertex = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
export const glowFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uI;
varying vec2 vUv;
void main(){
  float r = length(vUv * 2.0 - 1.0);
  float g = pow(max(1.0 - r, 0.0), 3.0);
  float core = exp(-r * r * 40.0);
  gl_FragColor = vec4(uColor * (g * 0.9 + core * 1.6) * uI, clamp(g + core, 0.0, 1.0));
  #include <colorspace_fragment>
}
`

/* ---------- Buraco negro: disco de acreção ---------- */
export const diskVertex = /* glsl */ `
varying vec2 vP;
varying vec3 vW;
void main(){
  vP = position.xy;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`
export const diskFragment = /* glsl */ `
uniform float uTime;
uniform float uR;
uniform float uInner;
uniform float uOuter;
uniform vec3 uBH;
varying vec2 vP;
varying vec3 vW;
${NOISE_GLSL}
void main(){
  float r = length(vP) / uR;
  float ang = atan(vP.y, vP.x);
  float a2 = ang - uTime * 0.9 * pow(r, -1.5);          // rotação diferencial (kepleriana)
  vec2 cs = vec2(cos(a2), sin(a2));
  float st = fbm(vec3(cs * 2.2, r * 9.0));              // estrias concêntricas
  float bl = fbm(vec3(cs * r * 0.8, r * 2.0 + 4.0));    // aglomerados de gás
  float dens = 0.35 + 0.65 * (st * 0.6 + bl * 0.4);
  float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);
  vec3 cHot = vec3(1.0, 0.92, 0.78);
  vec3 cMid = vec3(1.0, 0.52, 0.16);
  vec3 cCool = vec3(0.5, 0.1, 0.04);
  vec3 col = mix(cHot, cMid, smoothstep(0.0, 0.25, t));
  col = mix(col, cCool, smoothstep(0.25, 1.0, t));
  float inten = pow(1.0 - t, 1.8) * 2.6 + 0.2;
  // efeito Doppler: lado que se aproxima fica mais brilhante
  vec3 rad = normalize(vec3(vW.x - uBH.x, 0.0, vW.z - uBH.z));
  vec3 tang = vec3(-rad.z, 0.0, rad.x);
  vec3 V = normalize(cameraPosition - vW);
  inten *= pow(max(1.0 + 0.75 * dot(tang, V), 0.1), 3.0);
  float alpha = smoothstep(uInner, uInner + 0.35, r) * (1.0 - smoothstep(uOuter - 1.5, uOuter, r));
  gl_FragColor = vec4(col * inten * dens, alpha * dens);
  #include <colorspace_fragment>
}
`

/* ---------- Buraco negro: halo/anel de luz curvada (billboard) ---------- */
export const haloFragment = /* glsl */ `
uniform float uTime;
uniform float uPlane;
varying vec2 vUv;
${NOISE_GLSL}
void main(){
  vec2 q = (vUv * 2.0 - 1.0) * uPlane;     // em unidades de raio da sombra
  float r = length(q);
  float ang = atan(q.y, q.x);
  float prof = exp(-pow((r - 1.3) / 0.07, 2.0)) * 1.3 + exp(-(r - 1.3) * 1.7) * step(1.3, r) * 0.5;
  float tb = 0.3 + 0.7 * pow(abs(sin(ang)), 0.8);       // mais forte em cima/embaixo (luz do lado de trás do disco)
  float flick = 0.7 + 0.3 * fbm(vec3(cos(ang - uTime * 0.3) * 2.0, sin(ang - uTime * 0.3) * 2.0, r * 6.0));
  float dop = 1.0 + 0.45 * cos(ang);
  float fade = 1.0 - smoothstep(uPlane * 0.8, uPlane, r);
  vec3 col = mix(vec3(1.0, 0.55, 0.2), vec3(1.0, 0.92, 0.78), exp(-(r - 1.3) * 3.0));
  float I = prof * tb * flick * dop * fade;
  gl_FragColor = vec4(col * I * 1.6, clamp(I, 0.0, 1.0));
  #include <colorspace_fragment>
}
`

/* ---------- Buraco negro: partículas orbitando (posição calculada na GPU) ---------- */
export const bhPartVertex = /* glsl */ `
attribute float aR;
attribute float aPhase;
attribute float aY;
attribute float aSize;
uniform float uTime;
uniform float uR;
uniform float uPx;
varying float vT;
void main(){
  float ang = aPhase + uTime * 0.9 * pow(aR, -1.5);
  vec3 pos = vec3(cos(ang) * aR, aY, sin(ang) * aR) * uR;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSize * uPx * 260.0 / max(-mv.z, 1.0), 1.0 * uPx, 6.0 * uPx);
  vT = clamp((aR - 1.9) / 5.0, 0.0, 1.0);
}
`
export const bhPartFragment = /* glsl */ `
varying float vT;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = pow(1.0 - clamp(d, 0.0, 1.0), 2.0);
  vec3 col = mix(vec3(1.0, 0.85, 0.65), vec3(0.9, 0.35, 0.12), vT);
  gl_FragColor = vec4(col * 1.4, a * 0.8);
  #include <colorspace_fragment>
}
`
