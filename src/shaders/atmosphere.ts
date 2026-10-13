export const atmosphereVertex = /* glsl */ `
varying vec3 vN;
varying vec3 vW;
void main(){
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

/**
 * Halo externo por TRÁS do planeta (BackSide, aditivo). `a` = 1 no limbo → 0 na borda do halo.
 * Espalhamento: azul no lado diurno, avermelhado perto do terminador (uTwi).
 */
export const atmosphereFragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uSunPos;
uniform float uIntensity;
uniform float uPower;
uniform float uAmax;
uniform float uLit;
uniform float uTwi;
varying vec3 vN;
varying vec3 vW;
void main(){
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  vec3 L = normalize(uSunPos - vW);
  float a = clamp(-dot(N, V) / uAmax, 0.0, 1.0);
  float ndl = dot(N, L);
  float lit = mix(1.0, 0.1 + 0.9 * smoothstep(-0.4, 0.5, ndl), uLit);
  float tw = exp(-pow(ndl * 3.2, 2.0));
  vec3 col = mix(uColor, vec3(1.0, 0.48, 0.22), tw * uTwi * uLit);
  float alpha = pow(a, uPower) * uIntensity * lit;
  gl_FragColor = vec4(col * alpha, alpha);
  #include <colorspace_fragment>
}
`
