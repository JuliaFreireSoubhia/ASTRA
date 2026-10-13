import type { DeepGalaxy } from '../types/celestial'

export const GALAXIES: DeepGalaxy[] = [
  {
    id: 'andromeda', name: 'Andromeda Galaxy', kind: 'galaxy', category: 'galaxies',
    tagline: 'Our nearest large galactic neighbor',
    description: 'A spiral of about a trillion stars, falling toward the Milky Way. In roughly 4–5 billion years the two will merge.',
    facts: [
      { label: 'Name', value: 'Andromeda Galaxy (M31)' },
      { label: 'Type', value: 'Spiral Galaxy' },
      { label: 'Distance', value: '~2.5 million light-years' },
      { label: 'Diameter', value: '≈ 220,000 light-years' },
      { label: 'Stars', value: '≈ 1 trillion' },
      { label: 'Approach speed', value: '≈ 110 km/s' },
    ],
    note: 'Artistic particle representation. Star positions are generated, not catalogued; the scale of the journey here is logarithmic.',
    lightYears: 2_500_000, direction: [0.45, 0.2, -0.87],
    view: { distance: 4600, azimuthDeg: 10, elevationDeg: 38, minFactor: 0.12 },
    radius: 2400, arms: 2, twist: 3.4, tilt: [-0.35, 0.25],
    colors: { core: '#ffe2b0', inner: '#ffd09a', arm: '#9ab8ff', hii: '#ff9ac8' },
  },
]
