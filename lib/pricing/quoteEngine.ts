export interface MaterialCostConfig {
  costPerGram: number; // EUR/gram
  densityGramsPerCm3: number;
}

export const MATERIAL_DENSITIES: Record<string, MaterialCostConfig> = {
  PLA: { costPerGram: 0.045, densityGramsPerCm3: 1.24 },
  PETG: { costPerGram: 0.055, densityGramsPerCm3: 1.27 },
  ABS: { costPerGram: 0.060, densityGramsPerCm3: 1.05 },
  TPU: { costPerGram: 0.090, densityGramsPerCm3: 1.20 },
  Resina: { costPerGram: 0.120, densityGramsPerCm3: 1.12 },
};

export interface QuoteCalculationInput {
  dimensionsMm: { x: number; y: number; z: number };
  solidVolumeCm3: number;
  infillPercentage: number; // e.g. 20 (for 20%)
  material: string;
  makerHourlyRateEur: number; // e.g. 3.50
  makerStartupFeeEur?: number; // e.g. 5.00
  scaleFactor?: number;
}

export interface QuoteBreakdown {
  materialGrams: number;
  materialCostEur: number;
  estimatedPrintHours: number;
  machineTimeCostEur: number;
  startupFeeEur: number;
  makerSubtotalEur: number;
  platformFeeEur: number; // 15%
  totalPriceEur: number;
  totalPriceCents: number;
}

/**
 * Calculates true 3D printing price based on physical volume, infill, and maker rates.
 * Runs securely on the server to prevent browser tampering.
 */
export function calculatePrintPrice(input: QuoteCalculationInput): QuoteBreakdown {
  const {
    solidVolumeCm3,
    infillPercentage,
    material,
    makerHourlyRateEur,
    makerStartupFeeEur = 5.00,
    scaleFactor = 1.0,
  } = input;

  const matConfig = MATERIAL_DENSITIES[material] || MATERIAL_DENSITIES.PLA;

  // 1. Scale-adjusted volume
  const scaledSolidVolumeCm3 = Math.max(0.5, solidVolumeCm3 * Math.pow(scaleFactor, 3));

  // 2. Realistic FDM shell vs infill volume approximation:
  // Shell walls (~3 perimeters) and solid roof/floor account for ~35% of part volume as 100% solid.
  // The remaining 65% of volume is filled at the requested infillPercentage.
  const solidShellFraction = 0.35;
  const infillFraction = 0.65 * (infillPercentage / 100);
  const effectiveMaterialVolumeCm3 = scaledSolidVolumeCm3 * (solidShellFraction + infillFraction);

  // 3. Weight calculation in grams
  const materialGrams = Number((effectiveMaterialVolumeCm3 * matConfig.densityGramsPerCm3).toFixed(1));

  // 4. Material cost
  const materialCostEur = Number((materialGrams * matConfig.costPerGram).toFixed(2));

  // 5. Estimated print time in hours:
  // Base volumetric flow rate ~ 14 mm³/s -> ~ 50.4 cm³/hour of extruded plastic
  // Plus fixed overhead of 20 min (bed heating, auto bed leveling, nozzle purge)
  const extrusionSpeedCm3PerHour = 18.0; // average layer time considering perimeters and retractions
  const rawPrintHours = effectiveMaterialVolumeCm3 / extrusionSpeedCm3PerHour;
  const warmupHours = 0.35; // ~20 min
  const estimatedPrintHours = Number((Math.max(0.5, rawPrintHours + warmupHours)).toFixed(2));

  // 6. Machine time cost
  const machineTimeCostEur = Number((estimatedPrintHours * makerHourlyRateEur).toFixed(2));

  // 7. Startup setup fee
  const startupFeeEur = makerStartupFeeEur;

  // 8. Maker subtotal (cost of production + maker margin)
  const makerSubtotalEur = Number((materialCostEur + machineTimeCostEur + startupFeeEur).toFixed(2));

  // 9. Platform fee (15% added on top or retained via destination charge)
  // Total = MakerSubtotal / 0.85 so platform gets 15% of gross
  const totalPriceEur = Number((makerSubtotalEur / 0.85).toFixed(2));
  const platformFeeEur = Number((totalPriceEur - makerSubtotalEur).toFixed(2));
  const totalPriceCents = Math.round(totalPriceEur * 100);

  return {
    materialGrams,
    materialCostEur,
    estimatedPrintHours,
    machineTimeCostEur,
    startupFeeEur,
    makerSubtotalEur,
    platformFeeEur,
    totalPriceEur,
    totalPriceCents,
  };
}
