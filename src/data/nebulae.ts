import type { DeepNebula } from '../types/celestial'

export const NEBULAE: DeepNebula[] = [
  {
    id: 'orion-nebula', name: 'Orion Nebula', kind: 'nebula', category: 'nebulae',
    tagline: 'A stellar nursery you can see with the naked eye',
    description: 'A cloud of gas and dust where new stars are being born. Its glow comes from the radiation of a few very hot young stars, the Trapezium.',
    facts: [
      { label: 'Name', value: 'Orion Nebula (M42)' },
      { label: 'Type', value: 'Emission nebula' },
      { label: 'Distance', value: '≈ 1,344 light-years' },
      { label: 'Diameter', value: '≈ 24 light-years' },
      { label: 'Constellation', value: 'Orion' },
      { label: 'Visible', value: 'Naked eye, in Orion’s sword' },
    ],
    note: 'Volumetric particle representation. Colors are inspired by telescope images, which assign colors to specific gases.',
    lightYears: 1344, direction: [0.05, -0.1, -0.99],
    view: { distance: 950, azimuthDeg: 25, elevationDeg: 22, minFactor: 0.25 },
    radius: 520,
    palette: { core: '#bfe6ff', mid: '#ff6fa8', outer: '#7a2a8f', accent: '#5b8cff' },
  },
]
