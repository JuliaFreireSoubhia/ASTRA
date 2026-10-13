export const starsVertex = /* glsl */ `
attribute float aSize;
attribute float aSeed;
attribute vec3 aColor;
uniform float uTime;
uniform float uPx;
varying vec3 vC;
varying float vA;
void main(){
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  float tw = 0.86 + 0.14 * sin(uTime * (0.6 + aSeed * 1.4) + aSeed * 60.0);
  gl_PointSize = aSize * uPx * tw;
  vC = aColor;
  vA = tw;
}
`

export const starsFragment = /* glsl */ `
varying vec3 vC;
varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = pow(smoothstep(0.5, 0.0, d), 2.0);
  gl_FragColor = vec4(vC * vA, a);
  #include <colorspace_fragment>
}
`
