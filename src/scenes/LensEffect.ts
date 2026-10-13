import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform, Vector2, Vector3 } from 'three'

const fragment = /* glsl */ `
uniform vec2 uCenter;
uniform float uShadow;
uniform float uAspect;
uniform float uStrength;
uniform vec3 uRingCol;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (uStrength <= 0.001) { outputColor = inputColor; return; }
  vec2 d = (uv - uCenter) * vec2(uAspect, 1.0);
  float th = length(d);
  float s = uShadow;
  // dentro da sombra: sem distorção (esfera preta + parte da frente do disco)
  if (th < s) { outputColor = inputColor; return; }
  // lente de massa pontual estilizada: fonte β = θ − E²/θ, com rampa para não ter descontinuidade na borda da sombra
  float ramp = smoothstep(s, s * 1.35, th);
  float E = s * 0.62;
  float beta = th - (E * E / th) * ramp * uStrength;
  vec2 srcUV = uCenter + (d / th) * beta / vec2(uAspect, 1.0);
  vec4 c = texture2D(inputBuffer, srcUV);
  // anel de fótons: linha fina e brilhante logo fora da sombra
  float pr = exp(-pow((th - s * 1.215) / (s * 0.04), 2.0));
  c.rgb += uRingCol * pr * uStrength * 1.1;
  outputColor = c;
}
`

/**
 * Lente gravitacional estilizada (screen-space). Amostra o buffer da cena em coordenadas defletidas
 * ao redor do buraco negro. CONVOLUTION = "lê outros pixels do inputBuffer".
 * Tuning: ver constantes em E (intensidade da curvatura) e 1.215 (posição do anel de fótons).
 */
export class LensEffect extends Effect {
  constructor() {
    super('LensEffect', fragment, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ['uCenter', new Uniform(new Vector2(0.5, 0.5))],
        ['uShadow', new Uniform(0.1)],
        ['uAspect', new Uniform(1)],
        ['uStrength', new Uniform(0)],
        ['uRingCol', new Uniform(new Vector3(1.0, 0.78, 0.5))],
      ]),
    })
  }
}
