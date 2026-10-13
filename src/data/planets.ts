import type { CelestialBody } from '../types/celestial'

/**
 * Sistema Solar. Tamanhos/distâncias de CENA são comprimidos; os `facts` são os valores reais.
 * Contagem de luas muda com novas descobertas: revise antes de publicar.
 * POIs: lat/lon seguem a convenção equirretangular padrão (lon 0 = Greenwich, + = leste).
 */
export const SOLAR_BODIES: CelestialBody[] = [
  {
    id: 'sun', name: 'Sun', kind: 'star', tagline: 'Our star',
    description: "A G-type star that holds 99.86% of the Solar System's mass. Its gravity keeps every planet in orbit.",
    facts: [
      { label: 'Distance from Earth', value: '149.6 million km' },
      { label: 'Diameter', value: '1,392,700 km' },
      { label: 'Surface temperature', value: '5,500 °C' },
      { label: 'Rotation', value: '≈ 25 days' },
      { label: 'Age', value: '4.6 billion years' },
      { label: 'Mass', value: '333,000 Earths' },
    ],
    radius: 3.2,
    orbit: { radius: 0, periodDays: 0, phase: 0 },
    rotation: { periodHours: 609, axialTiltDeg: 7.25 },
    surface: { kind: 'sun', colors: ['#ff6a10', '#ffb23d', '#fff0b0'], scale: 2.2 },
    atmosphere: { color: '#ff9a3c', intensity: 1.3, scale: 1.55, rim: 0 },
  },
  {
    id: 'mercury', name: 'Mercury', kind: 'planet', tagline: 'First planet from the Sun',
    description: 'The smallest planet and the fastest in orbit. With almost no atmosphere, its surface swings between extreme heat and cold.',
    facts: [
      { label: 'Distance from Sun', value: '57.9 million km' },
      { label: 'Diameter', value: '4,879 km' },
      { label: 'Moons', value: '0' },
      { label: 'Day', value: '58.6 Earth days' },
      { label: 'Year', value: '88 days' },
      { label: 'Temperature', value: '−180 to 430 °C' },
    ],
    radius: 0.38,
    orbit: { radius: 8.8, periodDays: 88, phase: 2.1 },
    rotation: { periodHours: 1407.6, axialTiltDeg: 0.03 },
    surface: {
      // Cinza quente e uniforme. Bacias gigantes (Caloris), planícies lisas, escarpas tectônicas; sem "mares" escuros.
      kind: 'mercury', colors: ['#5a5753', '#8e8a85', '#bfb8ac'], scale: 2.4, seed: 41.9, relief: 1.0, craters: 1.0,
      plains: 0.8, scarps: 1.0,
      basins: [
        { lonDeg: -170, latDeg: 30.5, radiusDeg: 18, fill: 'plains' },   // Caloris (≈1550 km)
        { lonDeg: 88, latDeg: -33, radiusDeg: 8.5, fill: 'plains' },     // Rembrandt
        { lonDeg: -124, latDeg: -20.5, radiusDeg: 7.5, fill: 'plains' }, // Beethoven
        { lonDeg: -165, latDeg: -16, radiusDeg: 6.5, fill: 'plains' },   // Tolstoj
        { lonDeg: 119, latDeg: 27, radiusDeg: 4, fill: 'rings' },        // Raditladi
        { lonDeg: 0, latDeg: 72, radiusDeg: 26, fill: 'smooth' },        // planícies boreais
        { lonDeg: -132, latDeg: 55, radiusDeg: 13, fill: 'smooth' },
      ],
    },
  },
  {
    id: 'venus', name: 'Venus', kind: 'planet', tagline: 'Second planet from the Sun',
    description: 'Wrapped in dense carbon dioxide clouds, Venus is the hottest planet. It spins backwards, so the Sun rises in the west.',
    facts: [
      { label: 'Distance from Sun', value: '108.2 million km' },
      { label: 'Diameter', value: '12,104 km' },
      { label: 'Moons', value: '0' },
      { label: 'Day', value: '243 Earth days (retrograde)' },
      { label: 'Year', value: '224.7 days' },
      { label: 'Temperature', value: '465 °C' },
    ],
    radius: 0.62,
    orbit: { radius: 12.8, periodDays: 224.7, phase: 4.0 },
    rotation: { periodHours: -5832.5, axialTiltDeg: 177.4 },
    surface: { kind: 'banded', colors: ['#bf8a4e', '#e9d1a0', '#f4e6c4'], scale: 1, bands: 3, warp: 1.4 },
    atmosphere: { color: '#ffd9a0', intensity: 0.7, rim: 0.9, twilight: 0.25 },
  },
  {
    id: 'earth', name: 'Earth', kind: 'planet', tagline: 'Third planet from the Sun',
    description: 'The only known world with liquid water on its surface and life. Its magnetic field and atmosphere shield everything beneath.',
    facts: [
      { label: 'Distance from Sun', value: '149.6 million km' },
      { label: 'Diameter', value: '12,742 km' },
      { label: 'Moons', value: '1' },
      { label: 'Day', value: '23h 56m' },
      { label: 'Year', value: '365.25 days' },
      { label: 'Average temperature', value: '15 °C' },
    ],
    radius: 0.65,
    orbit: { radius: 18, periodDays: 365.25, phase: 0.9 },
    rotation: { periodHours: 23.934, axialTiltDeg: 23.4 },
    surface: { kind: 'earth', colors: ['#06285a', '#2f6a35', '#b59a62'], scale: 2.4, seed: 3.7, relief: 1.0 },
    atmosphere: { color: '#5aa2ff', intensity: 1.15, rim: 1.0, twilight: 1.0 },
    clouds: true,
    pois: [
      { id: 'everest', name: 'Mount Everest', lat: 27.99, lon: 86.93, zoom: 0.55,
        info: 'At 8,849 m, the highest point above sea level. It sits on the border of Nepal and Tibet and is still rising a few millimeters per year.' },
      { id: 'amazon', name: 'Amazon Rainforest', lat: -3.5, lon: -62.2, zoom: 0.7,
        info: 'The largest tropical rainforest on Earth, home to roughly one in ten known species. Its river carries more water than any other.' },
      { id: 'sahara', name: 'Sahara', lat: 23.4, lon: 12.0, zoom: 0.7,
        info: 'The largest hot desert in the world, about the size of the United States. Dust from here fertilizes the Amazon across the ocean.' },
      { id: 'pacific', name: 'Pacific Ocean', lat: 0, lon: -150, zoom: 0.8,
        info: 'The largest and deepest ocean, covering about a third of the planet. You can fit every continent inside it.' },
    ],
  },
  {
    id: 'moon', name: 'Moon', kind: 'planet', tagline: "Earth's only natural satellite",
    description: 'Its far side is always hidden from us. Dark plains of ancient lava and countless impact craters record four billion years of bombardment.',
    facts: [
      { label: 'Distance from Earth', value: '384,400 km' },
      { label: 'Diameter', value: '3,474 km' },
      { label: 'Surface gravity', value: '1/6 of Earth' },
      { label: 'Day', value: '29.5 Earth days' },
      { label: 'Orbit', value: '27.3 days' },
      { label: 'Temperature', value: '−173 to 127 °C' },
    ],
    radius: 0.18,
    orbit: { radius: 1.9, periodDays: 27.3, phase: 0.2, parentId: 'earth' },
    rotation: { periodHours: 655.7, axialTiltDeg: 1.5, locked: true },
    surface: {
      // Terras altas claras e saturadas de crateras + mares basálticos escuros, quase todos no lado próximo (lon -60…60).
      kind: 'moon', colors: ['#54555b', '#8f8d87', '#d2d0c8'], scale: 3, seed: 17.3, relief: 1.2, craters: 1.0, mare: 0.9,
      basins: [
        { lonDeg: -57, latDeg: 18, radiusDeg: 24, fill: 'mare' },   // Oceanus Procellarum
        { lonDeg: -16, latDeg: 35, radiusDeg: 17, fill: 'mare' },   // Mare Imbrium
        { lonDeg: 18, latDeg: 28, radiusDeg: 10, fill: 'mare' },    // Mare Serenitatis
        { lonDeg: 31, latDeg: 8, radiusDeg: 12, fill: 'mare' },     // Mare Tranquillitatis
        { lonDeg: 59, latDeg: 17, radiusDeg: 7, fill: 'mare' },     // Mare Crisium
        { lonDeg: 51, latDeg: -4, radiusDeg: 9, fill: 'mare' },     // Mare Fecunditatis
        { lonDeg: 34, latDeg: -15, radiusDeg: 6, fill: 'mare' },    // Mare Nectaris
        { lonDeg: -15, latDeg: -21, radiusDeg: 10, fill: 'mare' },  // Mare Nubium
        { lonDeg: -39, latDeg: -24, radiusDeg: 6, fill: 'mare' },   // Mare Humorum
        { lonDeg: -95, latDeg: -19, radiusDeg: 14, fill: 'rings' }, // Orientale (multianel, no limbo)
        { lonDeg: 180, latDeg: -53, radiusDeg: 28, fill: 'dusk' },  // Polo Sul–Aitken (lado oculto)
      ],
    },
  },
  {
    id: 'mars', name: 'Mars', kind: 'planet', tagline: 'Fourth planet from the Sun',
    description: 'A cold desert world with the tallest volcano in the Solar System, Olympus Mons, and canyons that dwarf the Grand Canyon.',
    facts: [
      { label: 'Distance from Sun', value: '227.9 million km' },
      { label: 'Diameter', value: '6,779 km' },
      { label: 'Moons', value: '2' },
      { label: 'Day', value: '24h 37m' },
      { label: 'Year', value: '687 days' },
      { label: 'Average temperature', value: '−65 °C' },
    ],
    radius: 0.48,
    orbit: { radius: 23.5, periodDays: 687, phase: 5.4 },
    rotation: { periodHours: 24.62, axialTiltDeg: 25.2 },
    surface: {
      kind: 'rocky', colors: ['#4a2418', '#b0583a', '#dca574'], scale: 3.2, warp: 0.9, relief: 0.8, craters: 0.45, seed: 1.3,
      spot: { lonDeg: -133.8, latDeg: 18.65, sizeDeg: [0.14, 0.14], color: '#d29a70', strength: 0.55, height: 1.4 },
    },
    atmosphere: { color: '#e8a47a', intensity: 0.3, rim: 0.45, twilight: 0.5 },
    pois: [
      { id: 'olympus', name: 'Olympus Mons', lat: 18.65, lon: -133.8, zoom: 0.55,
        info: 'The tallest volcano known in the Solar System: about 22 km high and as wide as France. Its gentle slopes hide a vast shield.' },
    ],
  },
  {
    id: 'jupiter', name: 'Jupiter', kind: 'planet', tagline: 'Fifth planet from the Sun',
    description: 'A gas giant more massive than all other planets combined. Its Great Red Spot is a storm larger than Earth.',
    facts: [
      { label: 'Distance from Sun', value: '778.5 million km' },
      { label: 'Diameter', value: '139,822 km' },
      { label: 'Moons', value: '95+' },
      { label: 'Day', value: '9h 56m' },
      { label: 'Year', value: '11.9 Earth years' },
      { label: 'Cloud-top temperature', value: '−110 °C' },
    ],
    radius: 1.9,
    orbit: { radius: 35, periodDays: 4333, phase: 1.2 },
    rotation: { periodHours: 9.925, axialTiltDeg: 3.1 },
    surface: {
      kind: 'banded', colors: ['#8a5636', '#ecdcc0', '#b0603a'], scale: 1, bands: 14, warp: 0.8,
      spot: { lonDeg: 20, latDeg: -22, sizeDeg: [0.2, 0.1], color: '#b8472b', strength: 0.9 },
    },
    atmosphere: { color: '#e8c9a0', intensity: 0.3, rim: 0.5 },
    pois: [
      { id: 'grs', name: 'Great Red Spot', lat: -22, lon: 20, zoom: 0.6,
        info: 'A storm that has raged for at least 150 years. It has been shrinking, but is still wider than Earth.' },
    ],
  },
  {
    id: 'saturn', name: 'Saturn', kind: 'planet', tagline: 'Sixth planet from the Sun',
    description: 'Famous for rings of ice and rock that span hundreds of thousands of kilometers, yet are often only tens of meters thick.',
    facts: [
      { label: 'Distance from Sun', value: '1.43 billion km' },
      { label: 'Diameter', value: '116,464 km' },
      { label: 'Moons', value: '270+' },
      { label: 'Day', value: '10h 33m' },
      { label: 'Year', value: '29.4 Earth years' },
      { label: 'Cloud-top temperature', value: '−140 °C' },
    ],
    radius: 1.6,
    orbit: { radius: 49, periodDays: 10759, phase: 3.3 },
    rotation: { periodHours: 10.66, axialTiltDeg: 26.7 },
    surface: { kind: 'banded', colors: ['#a88a5a', '#e8d6a4', '#c4a46c'], scale: 1, bands: 12, warp: 0.25 },
    atmosphere: { color: '#f0e0b0', intensity: 0.28, rim: 0.4 },
    rings: { inner: 1.235, outer: 2.27, color: '#d9c7a0' },
  },
  {
    id: 'uranus', name: 'Uranus', kind: 'planet', tagline: 'Seventh planet from the Sun',
    description: 'An ice giant tilted nearly 98°, so it rolls around the Sun on its side. Methane in its atmosphere gives it a pale cyan color.',
    facts: [
      { label: 'Distance from Sun', value: '2.87 billion km' },
      { label: 'Diameter', value: '50,724 km' },
      { label: 'Moons', value: '28+' },
      { label: 'Day', value: '17h 14m (retrograde)' },
      { label: 'Year', value: '84 Earth years' },
      { label: 'Cloud-top temperature', value: '−195 °C' },
    ],
    radius: 1.1,
    orbit: { radius: 63, periodDays: 30687, phase: 5.9 },
    rotation: { periodHours: -17.24, axialTiltDeg: 97.8 },
    surface: { kind: 'banded', colors: ['#7cc9d1', '#b3eaee', '#68b6c2'], scale: 1, bands: 5, warp: 0.12 },
    atmosphere: { color: '#9fe8f0', intensity: 0.65, rim: 0.85 },
  },
  {
    id: 'neptune', name: 'Neptune', kind: 'planet', tagline: 'Eighth planet from the Sun',
    description: 'The farthest planet: a dark, windy ice giant with the fastest winds in the Solar System, exceeding 2,000 km/h.',
    facts: [
      { label: 'Distance from Sun', value: '4.50 billion km' },
      { label: 'Diameter', value: '49,244 km' },
      { label: 'Moons', value: '16' },
      { label: 'Day', value: '16h 6m' },
      { label: 'Year', value: '164.8 Earth years' },
      { label: 'Cloud-top temperature', value: '−200 °C' },
    ],
    radius: 1.05,
    orbit: { radius: 76, periodDays: 60190, phase: 2.6 },
    rotation: { periodHours: 16.11, axialTiltDeg: 28.3 },
    surface: {
      kind: 'banded', colors: ['#1b3a96', '#3f6fe0', '#7fa6ff'], scale: 1, bands: 7, warp: 0.4,
      spot: { lonDeg: -40, latDeg: -20, sizeDeg: [0.22, 0.12], color: '#0a1b4f', strength: 0.75 },
    },
    atmosphere: { color: '#4d7cff', intensity: 0.85, rim: 0.9 },
  },
]
