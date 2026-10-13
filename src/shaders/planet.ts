import { NOISE_GLSL } from './noise'
import { RING_GLSL } from './ringProfile'

export const KIND = { rocky: 0, earth: 1, banded: 2, sun: 3, moon: 4, mercury: 5 } as const

export const planetVertex = /* glsl */ `
varying vec3 vObj;
varying vec3 vN;
varying vec3 vW;
varying vec2 vUv;
varying mat3 vRot;
void main(){
  vObj = normalize(position);
  vRot = mat3(modelMatrix);
  vN = normalize(vRot * normal);
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

/**
 * Shader procedural de superfície. Cores: rocky A=basalto escuro/mares, B=terreno, C=poeira/ejecta;
 * earth A=oceano B=vegetação C=deserto; banded A/B=faixas C=manchas; sun A=frio B=quente C=granulação.
 * Relevo: bump por derivadas de tela da altura (1 avaliação de ruído, sem custo extra por vizinhos).
 */
export const planetFragment = /* glsl */ `
uniform float uKind;
uniform vec3 uColA;
uniform vec3 uColB;
uniform vec3 uColC;
uniform float uScale;
uniform float uBands;
uniform float uWarp;
uniform float uSeed;
uniform float uTime;
uniform float uRelief;
uniform float uCraters;
uniform vec4 uSpot;      // lon, lat (rad), semi-eixos lon/lat (rad)
uniform vec3 uSpotCol;
uniform float uSpotK;
uniform float uSpotH;
uniform vec3 uSunPos;
uniform vec3 uAtmoColor;
uniform float uAtmoK;
uniform float uTwilight;
uniform sampler2D uMask;
uniform float uRingOn;
uniform float uRingIn;
uniform float uRingOut;
uniform vec3 uRingAxis;
uniform vec3 uPlanetPos;
uniform vec4 uBasin[12];   // lon, lat, raio (rad), tipo de preenchimento
uniform float uBasinN;
uniform float uMare;
uniform float uPlains;
uniform float uScarps;
varying vec3 vObj;
varying vec3 vN;
varying vec3 vW;
varying vec2 vUv;
varying mat3 vRot;
${NOISE_GLSL}
${RING_GLSL}

// Crateras: uma por célula (centro sorteado dentro da célula → nunca cruza a borda, só precisa de 1 célula)
float craterLayer(vec3 p, float s){
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 c = vec3(hash31(i + s), hash31(i + s + 7.3), hash31(i + s + 13.1)) * 0.4 + 0.3;
  float on = step(0.5, hash31(i + s + 21.9));
  float rad = 0.13 + 0.09 * hash31(i + s + 3.7);
  float d = length(f - c) / rad;
  float bowl = (d < 1.0) ? -(1.0 - d * d) * 0.7 : 0.0;
  float rim = 0.45 * exp(-pow((d - 1.05) * 6.0, 2.0));
  return on * (bowl + rim);
}


// ---- Bacias de impacto com anéis (Lua e Mercúrio): perfil radial multi-anel, x = distância/raio
float ringProfile(float x){
  float floorD = -0.45 * smoothstep(1.0, 0.55, x);
  float rim    = 0.65 * exp(-pow((x - 1.0) / 0.10, 2.0));
  float ring2  = 0.38 * exp(-pow((x - 0.62) / 0.09, 2.0));
  float peak   = 0.22 * exp(-pow((x - 0.30) / 0.06, 2.0));
  float outer  = 0.20 * exp(-pow((x - 1.45) / 0.12, 2.0));
  float ejecta = 0.10 * smoothstep(0.9, 1.0, x) * (1.0 - smoothstep(1.0, 2.0, x));
  return floorD + rim + ring2 + peak + outer + ejecta;
}

// Máscaras de preenchimento + altura das bacias nomeadas.
// O vetor wv é um vetor de deformação suave (ruído): o contorno do preenchimento fica orgânico, com baías e braços,
// e os anéis são deformados bem menos (continuam reconhecíveis). Nada de círculos perfeitos.
void basinsAt(vec3 v, vec3 wv, out float mare, out float plains, out float dusk, out float hb){
  mare = 0.0; plains = 0.0; dusk = 0.0; hb = 0.0;
  for (int i = 0; i < 12; i++) {
    if (float(i) >= uBasinN) break;
    vec4 b = uBasin[i];
    vec3 c = vec3(cos(b.y) * cos(b.x), sin(b.y), -cos(b.y) * sin(b.x));
    if (dot(v, c) < cos(min(3.0 * b.z, 3.1))) continue;          // longe demais: sem custo
    float code = b.w;
    float dF = acos(clamp(dot(normalize(v + wv * b.z * (code > 1.5 ? 0.5 : 0.7)), c), -1.0, 1.0)) / b.z;
    float dR = acos(clamp(dot(normalize(v + wv * b.z * 0.2), c), -1.0, 1.0)) / b.z;
    float fill = smoothstep(1.0, 0.85, dF);
    if (code > 0.5 && code < 1.5) mare = max(mare, fill);
    else if (code > 1.5 && code < 3.5) plains = max(plains, fill);
    else if (code > 3.5) dusk = max(dusk, fill);
    // mares: aro quase apagado (sem contorno artificial); bacias de planície (Caloris): anéis marcantes
    float ra = (code < 0.5) ? 1.0 : ((code < 1.5) ? 0.4 : 1.6);
    if (code < 2.5) hb += ringProfile(dR) * b.z * 0.2 * ra;
    else hb -= 0.04 * fill * b.z;
  }
}

/**
 * Crateras com distribuição de tamanhos (muitas pequenas, poucas grandes), idades diferentes
 * (antigas = rasas e suaves; jovens = fundas, com borda e ejecta claros) e centro sorteado em [0.1,0.9] da célula.
 * Consulta as 8 células mais próximas → sem emendas de grade. O parâmetro flood (0..1) = quanto o terreno foi soterrado por lava/planície.
 * Retorna (altura em unidades da esfera, brilho de cratera jovem). Camadas menores que ~2 px são puladas.
 */
vec2 craterLayerH(vec3 v, float freq, float prob, float rmax, float seed, float px, float flood){
  float diamU = rmax / freq;
  float fade = smoothstep(1.5 * px, 4.0 * px, diamU);
  if (fade <= 0.001) return vec2(0.0);
  vec3 q = v * freq + vec3(seed, seed * 0.7, seed * 1.3);
  vec3 i0 = floor(q);
  vec3 f = fract(q);
  vec3 s = vec3(f.x < 0.5 ? -1.0 : 1.0, f.y < 0.5 ? -1.0 : 1.0, f.z < 0.5 ? -1.0 : 1.0);
  float h = 0.0;
  float fresh = 0.0;
  float pr = prob * (1.0 - flood * 0.75);
  for (int a = 0; a < 2; a++) {
    for (int b = 0; b < 2; b++) {
      for (int c = 0; c < 2; c++) {
        vec3 ci = i0 + vec3(float(a), float(b), float(c)) * s;
        if (hash31(ci + seed) > pr) continue;
        vec3 ctr = ci + vec3(hash31(ci + seed + 1.7), hash31(ci + seed + 4.1), hash31(ci + seed + 8.3)) * 0.8 + 0.1;
        float sz = hash31(ci + seed + 12.9);
        float rad = rmax * (0.3 + 0.7 * sz * sz);
        float d = length(q - ctr) / rad;
        if (d > 1.5) continue;
        float age = hash31(ci + seed + 20.1);
        float depth = mix(1.0, 0.3, age) * (1.0 - flood * 0.7);
        float bowl = -smoothstep(1.0, 0.3, d);
        float rim = 0.5 * exp(-pow((d - 1.0) / 0.12, 2.0)) * mix(1.0, 0.4, age);
        float eject = 0.12 * smoothstep(0.85, 1.0, d) * (1.0 - smoothstep(1.0, 1.5, d));
        float peak = 0.35 * smoothstep(0.17, 0.28, rad) * exp(-pow(d / 0.1, 2.0));
        h += (bowl * depth + rim + eject + peak * depth) * rad / freq * 0.3;
        fresh = max(fresh, pow(1.0 - age, 5.0) * (1.0 - smoothstep(0.9, 1.5, d)));
      }
    }
  }
  return vec2(h, fresh) * fade;
}

// Mancha elíptica em lon/lat (Grande Mancha Vermelha etc.)
float spotShape(out float rimv){
  float lon = atan(-vObj.z, vObj.x);
  float lat = asin(clamp(vObj.y, -1.0, 1.0));
  float dl = lon - uSpot.x;
  dl = atan(sin(dl), cos(dl)) * cos(lat);
  float dt = lat - uSpot.y;
  float e = (dl * dl) / (uSpot.z * uSpot.z) + (dt * dt) / (uSpot.w * uSpot.w);
  rimv = exp(-pow((sqrt(e) - 1.15) * 5.0, 2.0));
  return smoothstep(1.0, 0.2, e);
}

// Bump por derivadas de tela (Mikkelsen) em espaço de objeto
vec3 bumpN(vec3 N, vec3 pos, float h, float k){
  vec3 dpdx = dFdx(pos);
  vec3 dpdy = dFdy(pos);
  float dhx = dFdx(h);
  float dhy = dFdy(h);
  vec3 r1 = cross(dpdy, N);
  vec3 r2 = cross(N, dpdx);
  float det = dot(dpdx, r1);
  vec3 g = sign(det) * (dhx * r1 + dhy * r2);
  return normalize(abs(det) * N - k * g);
}

float ringShadow(vec3 W, vec3 L){
  if (uRingOn < 0.5) return 1.0;
  float den = dot(L, uRingAxis);
  if (abs(den) < 1e-4) return 1.0;
  float t = dot(uPlanetPos - W, uRingAxis) / den;
  if (t <= 0.0) return 1.0;
  vec3 hit = W + L * t;
  float r01 = (length(hit - uPlanetPos) - uRingIn) / (uRingOut - uRingIn);
  return 1.0 - 0.9 * ringAlpha(r01);
}

void main(){
  vec3 No = normalize(vObj);
  vec3 N = normalize(vN);
  vec3 L = normalize(uSunPos - vW);
  vec3 V = normalize(cameraPosition - vW);
  vec3 p = vObj * uScale + vec3(uSeed);
  vec3 col = vec3(0.0);
  vec3 emis = vec3(0.0);
  float spec = 0.0;
  float specW = 0.0;
  float h = 0.0;
  float bumpK = 0.0;
  vec3 outColor;

  float rimv = 0.0;
  float spot = 0.0;
  if (uSpotK > 0.0) spot = spotShape(rimv);

  if (uKind > 2.5 && uKind < 3.5) {
    // ---------------- SOL / ESTRELAS (emissivo; >1 alimenta o bloom)
    float ndvS = max(dot(N, V), 0.0);
    float g  = fbm(p + vec3(0.0, 0.0, uTime * 0.05));
    float g2 = fbm(p * 3.0 - vec3(uTime * 0.07));
    col = mix(uColA, uColB, smoothstep(0.25, 0.8, g));
    col = mix(col, uColC, smoothstep(0.55, 0.92, g2) * 0.55);
    float sp = smoothstep(0.62, 0.72, fbm(p * 0.8 + 3.0));
    col *= 1.0 - 0.5 * sp;
    col *= mix(0.55, 1.0, pow(ndvS, 0.5));
    outColor = col * 1.7;
  } else {
    if (uKind < 0.5) {
      // ---------------- ROCHOSO (Mercúrio, Lua, Marte)
      float cr = 0.0;
      if (uCraters > 0.0) {
        cr = (craterLayer(p * 2.2, 1.0) + 0.7 * craterLayer(p * 5.1 + 3.0, 2.0) + 0.5 * craterLayer(p * 11.0 + 7.0, 3.0)) * uCraters;
      }
      float base = fbm(p);
      float d = fbm(p * 4.0 + 5.0);
      h = base * 0.6 + cr * 0.25;
      col = mix(uColA, uColB, smoothstep(0.30, 0.70, base));
      col = mix(col, uColC, smoothstep(0.55, 0.85, d) * 0.5);
      float maria = smoothstep(0.52, 0.64, fbm(p * 0.4 + 9.0));      // regiões escuras de grande escala
      col = mix(col, uColA, maria * 0.7);
      col *= 0.85 + 0.35 * d;
      col *= 1.0 + cr * 0.55;                                        // fundo escuro, borda clara
      float cap = smoothstep(0.90, 0.96, abs(vObj.y) + (d - 0.5) * 0.08) * uWarp;
      col = mix(col, vec3(0.9, 0.93, 0.97), cap);
      if (spot > 0.0) { col = mix(col, uSpotCol, spot * uSpotK); h += spot * uSpotH * 0.5; }
      bumpK = uRelief * 0.05;
    } else if (uKind < 1.5) {
      // ---------------- TERRA (máscara de continentes + detalhe procedural)
      vec4 m = texture2D(uMask, vUv);
      float cn = fbm(vObj * 14.0 + uSeed) - 0.5;
      float landM = m.r;
      float land = smoothstep(0.46, 0.54, landM + cn * 0.30);         // costa fractal
      float shelf = smoothstep(0.02, 0.38, landM);                    // plataforma continental
      float elev = clamp(m.g * (0.55 + 0.9 * fbm(vObj * 22.0)) + land * 0.12 * fbm(vObj * 40.0), 0.0, 1.0) * land;
      float arid = clamp(m.b + (fbm(vObj * 6.0 + 2.0) - 0.5) * 0.35, 0.0, 1.0);
      float lat = abs(vObj.y);

      float tropics = exp(-pow(vObj.y * 3.0, 2.0));
      float veg = clamp((1.0 - arid) * (0.55 + 0.6 * fbm(vObj * 9.0 + 2.0)), 0.0, 1.0);
      vec3 grass = mix(uColB * 1.35, uColB * 0.5, tropics * 0.9);    // floresta tropical mais escura
      vec3 landCol = mix(uColC, grass, veg);
      landCol = mix(landCol, vec3(0.42, 0.40, 0.36), smoothstep(0.35, 0.75, elev));   // rocha em altitude
      landCol = mix(landCol, vec3(0.52, 0.54, 0.47), smoothstep(0.70, 0.86, lat));    // tundra
      float snow = smoothstep(0.62, 0.86, elev + (lat - 0.4) * 0.35);
      landCol = mix(landCol, vec3(0.94, 0.96, 0.99), snow);
      landCol *= 0.88 + 0.24 * fbm(vObj * 60.0);                     // microtextura

      vec3 deep = uColA * 0.75;
      vec3 shallow = vec3(0.05, 0.36, 0.46);
      vec3 ocean = mix(deep, shallow, shelf * 0.85);
      ocean *= 0.9 + 0.2 * fbm(vObj * 18.0 + 5.0);

      col = mix(ocean, landCol, land);
      float ice = smoothstep(0.80, 0.88, lat + (fbm(vObj * 6.0) - 0.5) * 0.1);
      col = mix(col, vec3(0.93, 0.96, 1.0), ice);
      float oceanMask = (1.0 - land) * (1.0 - ice);

      h = elev * 0.9 + land * 0.06 * fbm(vObj * 70.0);
      bumpK = uRelief * 0.045 * land;

      // reflexo especular nos oceanos (brilho do Sol + brilho largo)
      float ndlE = dot(N, L);
      vec3 H = normalize(L + V);
      spec = (pow(max(dot(N, H), 0.0), 130.0) * 1.2 + pow(max(dot(N, H), 0.0), 16.0) * 0.1) * oceanMask;
      specW = 1.0;

      // luzes noturnas: cidades concentradas em terra, perto da costa, fora de desertos e polos
      float night = smoothstep(0.08, -0.20, ndlE);
      float pop = smoothstep(0.55, 0.80, fbm(vObj * 11.0 + 3.0)) * land * (1.0 - arid * 0.85) * (1.0 - smoothstep(0.62, 0.8, lat));
      float dots = step(0.76, vnoise(vObj * 170.0)) + 0.35 * smoothstep(0.6, 0.9, fbm(vObj * 45.0));
      emis = vec3(1.0, 0.76, 0.42) * pop * dots * night * 1.5 * (1.0 - ice);
    } else if (uKind < 2.5) {
      // ---------------- GIGANTES (faixas turbulentas, manchas, zonas finas)
      float w = fbm(p * 1.2 + vec3(uTime * 0.01)) * uWarp;
      float lat = vObj.y;
      float zon = vnoise(vec3(lat * uBands * 1.2 + w * 1.5, 3.1, 0.7));
      float b = sin((lat + w * 0.35) * uBands * 3.14159265) * 0.5 + 0.5;
      b = mix(b, zon, 0.5);
      float t2 = fbm(vec3(vObj.x * 3.0, lat * uBands * 0.9 + w * 2.0, vObj.z * 3.0));
      b = mix(b, t2, 0.4);
      col = mix(uColA, uColB, smoothstep(0.15, 0.85, b));
      float sp2 = fbm(vec3(vObj.x * 6.0, lat * uBands * 2.0 + w, vObj.z * 6.0) + uSeed);
      col = mix(col, uColC, smoothstep(0.55, 0.85, sp2) * 0.4);
      float fine = fbm(vec3(vObj.x * 16.0, lat * uBands * 4.0 + w * 4.0, vObj.z * 16.0));
      col *= 0.9 + 0.2 * fine;
      if (spot > 0.0) {
        vec3 sc = uSpotCol * (0.8 + 0.4 * fbm(vObj * 30.0 + uTime * 0.02));
        col = mix(col, sc, spot * uSpotK);
        col += rimv * 0.10 * uSpotK;                                 // halo claro ao redor do ciclone
      }
      // escurecimento de limbo (profundidade atmosférica)
      col *= mix(0.62, 1.0, pow(max(dot(N, V), 0.0), 0.4));
    } else if (uKind < 4.5) {
      // ---------------- LUA: terras altas claras + mares basálticos escuros, concentrados no lado voltado à Terra
      float px = length(dFdx(vObj)) + length(dFdy(vObj));
      vec3 wv = vec3(vnoise(p * 2.1 + 1.0), vnoise(p * 2.1 + 5.0), vnoise(p * 2.1 + 9.0)) - 0.5;
      wv += (vec3(vnoise(p * 6.0 + 3.0), vnoise(p * 6.0 + 7.0), vnoise(p * 6.0 + 11.0)) - 0.5) * 0.4;
      float mB, plB, duB, ringH;
      basinsAt(vObj, wv, mB, plB, duB, ringH);
      float near = smoothstep(-0.5, 0.45, vObj.x);      // +X = face voltada à Terra (rotação travada: ver Body.tsx)
      float mn = smoothstep(0.56, 0.68, fbm(p * 0.45 + vec3(5.0, 1.0, 9.0))) * near * uMare;
      float mare = max(mB, mn);
      mare = smoothstep(0.3, 0.7, mare + (fbm(p * 3.5 + 2.0) - 0.5) * 1.0);       // costa irregular dos mares

      // crateras: terras altas saturadas; mares jovens, quase sem crateras pequenas e com as grandes semi-soterradas
      vec2 c0 = craterLayerH(vObj, 1.3, 0.70 * uCraters, 0.30, uSeed + 1.0, px, mare);
      vec2 c1 = craterLayerH(vObj, 2.9, 0.65 * uCraters, 0.30, uSeed + 5.0, px, mare);
      vec2 c2 = craterLayerH(vObj, 6.5, 0.62 * uCraters, 0.30, uSeed + 9.0, px, mare);
      vec2 c3 = craterLayerH(vObj, 14.0, 0.65 * uCraters, 0.30, uSeed + 13.0, px, mare);
      vec2 c4 = craterLayerH(vObj, 31.0, 0.70 * uCraters, 0.30, uSeed + 17.0, px, mare);
      float hC = c0.x + c1.x + c2.x + c3.x + c4.x;
      float fresh = min(1.0, max(max(max(c0.y, c1.y), max(c2.y, c3.y)), c4.y));
      h = hC + ringH * (1.0 - mare * 0.5);

      vec3 hi = mix(uColB, uColC, smoothstep(0.35, 0.8, fbm(p * 1.7 + 3.0)) * 0.55);
      hi *= (0.9 + 0.2 * fbm(p * 9.0)) * (1.0 - 0.3 * duB);
      vec3 ma = uColA * (0.78 + 0.44 * fbm(p * 2.2 + 11.0)) * (0.93 + 0.14 * fbm(p * 12.0));
      ma = mix(ma, ma * vec3(1.1, 1.0, 0.88), smoothstep(0.4, 0.7, fbm(p * 1.4 + 21.0)));   // basalto: variação ferro/titânio
      col = mix(hi, ma, mare);
      col *= 1.0 + fresh * 0.8 + clamp(ringH, -0.01, 0.03) * 3.0 * (1.0 - mare);  // crateras jovens e cristas de anel: claras, sem ficarem pretas

      // sistema de raios de Tycho
      float tl = radians(-43.3);
      float tg = radians(-11.4);
      vec3 tc = vec3(cos(tl) * cos(tg), sin(tl), -cos(tl) * sin(tg));
      vec3 tn = normalize(vec3(0.0, 1.0, 0.0) - tc.y * tc);
      vec3 te = cross(tn, tc);
      float dT = acos(clamp(dot(vObj, tc), -1.0, 1.0));
      float aT = atan(dot(vObj, te), dot(vObj, tn));
      float streak = smoothstep(0.5, 0.8, fbm(vec3(cos(aT), sin(aT), 0.3) * 6.0 + 4.0));
      col *= 1.0 + 0.5 * streak * exp(-dT * 2.2) * smoothstep(0.03, 0.12, dT) + 0.5 * smoothstep(0.04, 0.0, dT);
      col *= 0.96 + 0.1 * fbm(p * 40.0);
      bumpK = uRelief;
    } else {
      // ---------------- MERCÚRIO: cinza uniforme, bacias gigantes (Caloris), planícies lisas e escarpas tectônicas
      float px = length(dFdx(vObj)) + length(dFdy(vObj));
      vec3 wv = vec3(vnoise(p * 2.1 + 3.0), vnoise(p * 2.1 + 8.0), vnoise(p * 2.1 + 14.0)) - 0.5;
      wv += (vec3(vnoise(p * 6.0 + 5.0), vnoise(p * 6.0 + 9.0), vnoise(p * 6.0 + 13.0)) - 0.5) * 0.4;
      float mB, plB, duB, ringH;
      basinsAt(vObj, wv, mB, plB, duB, ringH);
      float pn = smoothstep(0.50, 0.64, fbm(p * 0.55 + vec3(2.0, 8.0, 5.0))) * uPlains;   // planícies intercrateras
      float plains = max(max(plB, pn), mB);
      plains = smoothstep(0.3, 0.7, plains + (fbm(p * 3.5 + 1.0) - 0.5) * 0.9);

      // crateras: espectro de tamanhos diferente da Lua e mais regular; planícies enterram as pequenas
      vec2 c0 = craterLayerH(vObj, 1.7, 0.40 * uCraters, 0.30, uSeed + 2.0, px, plains);
      vec2 c1 = craterLayerH(vObj, 3.8, 0.50 * uCraters, 0.30, uSeed + 6.0, px, plains);
      vec2 c2 = craterLayerH(vObj, 8.5, 0.60 * uCraters, 0.30, uSeed + 10.0, px, plains);
      vec2 c3 = craterLayerH(vObj, 19.0, 0.65 * uCraters, 0.30, uSeed + 14.0, px, plains);
      vec2 c4 = craterLayerH(vObj, 42.0, 0.70 * uCraters, 0.30, uSeed + 18.0, px, plains);
      float hC = (c0.x + c1.x + c2.x + c3.x + c4.x) * 0.75;      // gravidade maior → crateras mais rasas
      float fresh = min(1.0, max(max(max(c0.y, c1.y), max(c2.y, c3.y)), c4.y));

      // escarpas lobadas / cristas: linhas finas e sinuosas, só em certas regiões
      float rq = fbm(p * 0.9 + fbm(p * 0.4) * 1.5 + 5.0);
      float ridged = 1.0 - abs(2.0 * rq - 1.0);
      float region = smoothstep(0.45, 0.6, fbm(p * 0.7 + 17.0));
      float scarp = smoothstep(0.945, 0.985, ridged) * region * uScarps;
      h = (hC + ringH + scarp * 0.008) * (1.0 - plains * 0.3);

      vec3 base = mix(uColA, uColB, smoothstep(0.25, 0.75, fbm(p * 1.3 + 4.0)) * 0.85);
      base = mix(base, uColC, smoothstep(0.62, 0.85, fbm(p * 3.0 + 9.0)) * 0.35);
      base = mix(base, base * vec3(1.12, 1.0, 0.86), smoothstep(0.45, 0.7, fbm(p * 0.5 + 3.0)) * 0.7);   // manchas amarronzadas
      base = mix(base, base * vec3(1.10, 1.03, 0.92) * 1.14, plains * 0.65);                           // planícies: um pouco mais claras e quentes
      base *= (0.92 + 0.16 * fbm(p * 14.0)) * (1.0 + fresh * 0.7 + clamp(ringH, -0.01, 0.03) * 3.0) * (1.0 - scarp * 0.08);
      float lum = dot(base, vec3(0.3, 0.59, 0.11));
      col = mix(vec3(lum), base, 0.8);                              // menos saturado que a Lua: cinza predominante
      bumpK = uRelief;
    }

    // relevo
    if (bumpK > 0.0) {
      vec3 Nb = bumpN(No, vObj, h, bumpK);
      N = normalize(vRot * Nb);
    }
    float ndl = dot(N, L);
    float ndv = max(dot(N, V), 0.0);
    float diff = smoothstep(-0.06, 0.62, ndl);
    float sh = ringShadow(vW, L);

    vec3 lit = col * (diff * sh + 0.018);
    lit += spec * diff * sh * vec3(0.9, 0.95, 1.0);
    lit += emis;
    // luz do pôr do sol no terminador + aro atmosférico
    float twi = exp(-pow(dot(normalize(vN), L) * 5.0, 2.0));
    lit += col * vec3(1.0, 0.45, 0.2) * twi * 0.22 * uTwilight;
    vec3 rimCol = mix(uAtmoColor, vec3(1.0, 0.5, 0.25), twi * uTwilight);
    lit += rimCol * pow(1.0 - ndv, 3.0) * uAtmoK * smoothstep(-0.25, 0.45, dot(normalize(vN), L));
    outColor = lit;
  }
  gl_FragColor = vec4(outColor, 1.0);
  #include <colorspace_fragment>
}
`

/** Camada de nuvens (esfera separada): domínio deformado, sombreamento diurno e tom alaranjado no terminador. */
export const cloudsFragment = /* glsl */ `
uniform float uTime;
uniform vec3 uSunPos;
varying vec3 vObj;
varying vec3 vN;
varying vec3 vW;
varying vec2 vUv;
varying mat3 vRot;
${NOISE_GLSL}
void main(){
  vec3 N = normalize(vN);
  vec3 L = normalize(uSunPos - vW);
  float ndl = dot(N, L);
  vec3 p = vObj * 3.0 + vec3(uTime * 0.012, 0.0, 0.0);
  float warp = fbm(p * 1.5 + 3.0);
  float c  = fbm(p + warp * 0.9);
  float c2 = fbm(p * 3.0 + warp * 1.5 + 11.0);
  float dens = smoothstep(0.50, 0.74, c * 0.75 + c2 * 0.35);
  float a = dens * 0.9;
  float light = smoothstep(-0.12, 0.5, ndl) * 0.97 + 0.03;
  float shade = 1.0 - 0.28 * smoothstep(0.6, 1.0, c2);
  vec3 tint = mix(vec3(1.0, 0.72, 0.55), vec3(1.0), smoothstep(0.0, 0.35, ndl));
  gl_FragColor = vec4(tint * light * shade, a);
  #include <colorspace_fragment>
}
`
