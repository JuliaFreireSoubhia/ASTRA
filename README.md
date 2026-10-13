# ASTRA — interactive space exploration (v0.2)

React + TypeScript + Three.js (React Three Fiber) + Vite.

## Rodar
```bash
npm install
npm run dev        # http://localhost:5173 (também na rede local, p/ testar no celular)
npm run typecheck
npm run build
```
Sem novas dependências npm nesta versão (usa `postprocessing`, já presente).

## O que há de novo na v0.2
- **Planetas**: Terra (continentes, biomas, relevo, oceano com reflexo, nuvens separadas, luzes de cidade, scattering com tom de pôr do sol), Lua, Marte (crateras, relevo, Olympus Mons), Júpiter (Grande Mancha Vermelha), Saturno (anéis C/B/A, divisões de Cassini e Encke, sombras mútuas), Urano e Netuno (Grande Mancha Escura).
- **Deep Space** (menu → Deep Space, ou categorias no trilho): Andrômeda (partículas + poeira), Nebulosa de Órion (volumétrica), Sirius, Betelgeuse, Polaris, Sagittarius A* (disco, halo, partículas, lente gravitacional).
- **Pontos de interesse** (Terra, Marte, Júpiter): clique no marcador ou na lista "Places to explore".
- **Transição de escala**: Terra → Sistema Solar → espaço profundo → galáxia numa única câmera contínua; distâncias em escala **logarítmica** (`src/lib/scale.ts`).

## Estrutura (novidades)
```
src/data/        planets.ts stars.ts galaxies.ts nebulae.ts blackHoles.ts  + index.ts (registro, categorias)
src/scenes/deep/ DeepSpace (lazy) Galaxy OrionNebula StarObject BlackHole GlowSprite DeepLabel generate
src/scenes/      LensEffect (lente gravitacional) Effects CameraRig (foco: planeta | POI | objeto profundo)
src/planets/     PoiMarkers, TexturedPlanet (PBR opcional), Rings/Atmosphere/Clouds melhorados
src/lib/         scale (log), earthMask, poiRegistry, lens, rng
```

## Adicionar objetos
- **Estrela/galáxia/nebulosa/buraco negro**: nova entrada no arquivo da categoria (`direction`, `lightYears`, `view`). Sem outras mudanças.
- **POI**: adicione em `pois` do corpo (lat/lon em graus).
- **Novo tipo** (ex.: exoplaneta): defina o `kind` em `types/celestial.ts`, crie o componente em `scenes/deep/` e registre o `case` em `DeepSpace.tsx`.

## Ajustes finos (valores para mexer se algo não ficar bonito)
- Lente gravitacional: `E` e `1.215` em `scenes/LensEffect.ts`; disco `INNER/OUTER` em `BlackHole.tsx`.
- Bloom: `Effects.tsx` (intensity 0.55, threshold 1).
- Câmera do Deep Space: `DEEP_CAM` / `DEEP_TARGET` em `CameraRig.tsx`; `direction` e `view` nos dados.
- Qualidade/partículas: `lib/quality.ts`.

## Limitações
- Escala do Sistema Solar comprimida; Deep Space em escala logarítmica (avisado em About/notas).
- A máscara de continentes é simplificada (polígonos ~1°). Para fidelidade total use texturas reais (ver `public/textures/README.md`).
- Sombras são analíticas (anéis ↔ planeta), não shadow maps: shadow maps são instáveis em escalas astronômicas.
