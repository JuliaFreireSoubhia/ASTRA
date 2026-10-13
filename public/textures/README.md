# Texturas reais (opcional)

**Nenhum asset externo foi adicionado nesta versão.** As superfícies são geradas por shader e a Terra usa
uma máscara de continentes gerada em runtime (`src/lib/earthMask.ts`).

Para usar fotos reais, coloque os arquivos aqui e preencha `surface.textures` em `src/data/planets.ts`:

```ts
surface: {
  kind: 'earth', colors: [...],
  textures: { map: '/textures/earth_2k.webp', normal: '/textures/earth_normal_2k.webp',
              emissive: '/textures/earth_night_2k.webp', roughness: '/textures/earth_spec_2k.webp' },
}
```
Com `textures`, o planeta usa `MeshStandardMaterial` (PBR); atmosfera, nuvens procedurais, anéis e POIs continuam funcionando.
Os POIs usam lat/lon equirretangulares padrão, então coincidem com qualquer textura mundial padrão.

## Fontes recomendadas (verifique a licença atual antes de publicar)
| Fonte | Conteúdo | Licença (conferir no site) |
|---|---|---|
| NASA Visible Earth / Blue Marble — visibleearth.nasa.gov | Terra (dia, noite, relevo) | Domínio público (crédito à NASA recomendado) |
| NASA Scientific Visualization Studio — svs.gsfc.nasa.gov | Lua (LRO, mapas de elevação), Marte | Domínio público |
| Solar System Scope — solarsystemscope.com/textures | Todos os planetas, 2k/4k/8k | CC BY 4.0 (exige atribuição) |

## Boas práticas de peso
- 2k (2048×1024) basta para a Terra na home; 4k só em desktop.
- WebP/JPG para cor; KTX2 (Basis) via `KTX2Loader` reduz VRAM em ~4–6× (próxima versão).
- Não carregue 8k no mobile.
