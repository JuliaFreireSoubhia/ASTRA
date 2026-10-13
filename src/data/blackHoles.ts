import type { DeepBlackHole } from '../types/celestial'

export const BLACK_HOLES: DeepBlackHole[] = [
  {
    id: 'sagittarius-a', name: 'Sagittarius A*', kind: 'blackhole', category: 'blackholes',
    tagline: 'The black hole at the heart of our galaxy',
    description: 'Four million times the mass of the Sun, packed into a region smaller than Mercury’s orbit. Stars circle it at thousands of kilometers per second.',
    facts: [
      { label: 'Type', value: 'Supermassive Black Hole' },
      { label: 'Location', value: 'Center of the Milky Way' },
      { label: 'Mass', value: '~4 million solar masses' },
      { label: 'Distance', value: '≈ 26,700 light-years' },
      { label: 'Horizon radius', value: '≈ 12 million km' },
      { label: 'First imaged', value: '2022, Event Horizon Telescope' },
    ],
    note: 'Artistic representation inspired by general relativity. Light cannot escape the event horizon, so we see its dark shadow against hot gas in the accretion disk, whose light is bent around the hole. Colors, brightness and proportions are stylized, not simulated.',
    lightYears: 26_700, direction: [-0.78, 0.05, -0.62],
    view: { distance: 430, azimuthDeg: 28, elevationDeg: 9, minFactor: 0.4 },
    radius: 22,
  },
]
