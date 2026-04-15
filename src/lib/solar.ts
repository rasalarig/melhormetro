export type FacadeOrientation =
  | 'norte'
  | 'sul'
  | 'leste'
  | 'oeste'
  | 'nordeste'
  | 'noroeste'
  | 'sudeste'
  | 'sudoeste';

export interface SolarInfo {
  facadeSunExposure: string;
  recommendation: string;
  // Azimuth degrees for rendering the compass (0 = N, 90 = E, 180 = S, 270 = W)
  facadeAzimuth: number;
  // Approximate sunrise / sunset azimuths for Brazil (southern hemisphere, ~average)
  sunriseAzimuth: number;
  sunsetAzimuth: number;
}

// Azimuth lookup for each facade orientation
const ORIENTATION_AZIMUTH: Record<FacadeOrientation, number> = {
  norte: 0,
  nordeste: 45,
  leste: 90,
  sudeste: 135,
  sul: 180,
  sudoeste: 225,
  oeste: 270,
  noroeste: 315,
};

// Sun exposure description per orientation (southern hemisphere context)
const SUN_EXPOSURE: Record<FacadeOrientation, string> = {
  norte: 'Sol o dia todo — maior incidência solar no hemisfério sul',
  sul: 'Pouca incidência solar direta — fachada voltada para o polo',
  leste: 'Sol da manhã',
  oeste: 'Sol da tarde',
  nordeste: 'Sol da manhã e boa parte do dia',
  noroeste: 'Sol da tarde e boa parte do dia',
  sudeste: 'Sol da manhã (parcial)',
  sudoeste: 'Sol da tarde (parcial)',
};

const RECOMMENDATION: Record<FacadeOrientation, string> = {
  norte:
    'Excelente para quem quer luz natural o dia todo e ambientes sempre iluminados',
  sul:
    'Ideal para quem prefere ambientes frescos — menos calor no verão',
  leste:
    'Perfeito para quem curte sol da manhã na sala ou varanda',
  oeste:
    'Ótimo para quem aprecia sol da tarde — ambientes mais quentes no fim do dia',
  nordeste:
    'Boa opção: sol matinal abundante e tarde com luz difusa',
  noroeste:
    'Boa opção: tarde ensolarada e manhã com luz suave',
  sudeste:
    'Sol ameno pela manhã — conforto térmico equilibrado',
  sudoeste:
    'Sol moderado à tarde — conforto térmico equilibrado',
};

/**
 * Returns solar orientation info for a Brazilian property.
 *
 * Brazil sits mostly in the southern hemisphere, so:
 * - The sun arcs from East → North → West (roughly)
 * - North-facing facades receive the most direct sun year-round
 * - South-facing facades receive the least direct sun
 *
 * Average sunrise azimuth ~80° (slightly north of true east)
 * Average sunset azimuth  ~280° (slightly north of true west)
 *
 * @param lat  Property latitude (negative = southern hemisphere)
 * @param lng  Property longitude
 * @param facadeOrientation  Optional compass direction the facade faces
 */
export function getSolarInfo(
  lat: number,
  _lng: number,
  facadeOrientation?: string
): SolarInfo | null {
  if (!facadeOrientation) return null;

  const orientation = facadeOrientation as FacadeOrientation;
  if (!ORIENTATION_AZIMUTH[orientation]) return null;

  // In the southern hemisphere the sun transits to the north, so the arc is
  // roughly E → N → W.  In the northern hemisphere it would be E → S → W.
  // We compute a simple average azimuth based on latitude sign.
  const southernHemisphere = lat < 0;

  // Sunrise is slightly north of east in summer for southern hemisphere,
  // but on average we use ~80° (a touch north of due east) for Brazil.
  const sunriseAzimuth = southernHemisphere ? 80 : 100;
  const sunsetAzimuth = southernHemisphere ? 280 : 260;

  return {
    facadeAzimuth: ORIENTATION_AZIMUTH[orientation],
    sunriseAzimuth,
    sunsetAzimuth,
    facadeSunExposure: SUN_EXPOSURE[orientation],
    recommendation: RECOMMENDATION[orientation],
  };
}

export const FACADE_ORIENTATION_LABELS: Record<FacadeOrientation, string> = {
  norte: 'Norte',
  sul: 'Sul',
  leste: 'Leste',
  oeste: 'Oeste',
  nordeste: 'Nordeste',
  noroeste: 'Noroeste',
  sudeste: 'Sudeste',
  sudoeste: 'Sudoeste',
};

export const FACADE_ORIENTATION_OPTIONS: { value: FacadeOrientation; label: string }[] = [
  { value: 'norte', label: 'Norte' },
  { value: 'nordeste', label: 'Nordeste' },
  { value: 'leste', label: 'Leste' },
  { value: 'sudeste', label: 'Sudeste' },
  { value: 'sul', label: 'Sul' },
  { value: 'sudoeste', label: 'Sudoeste' },
  { value: 'oeste', label: 'Oeste' },
  { value: 'noroeste', label: 'Noroeste' },
];
