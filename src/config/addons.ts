/**
 * THE RAIL EXCHANGE™ — Add-On Configuration
 * 
 * @deprecated This file is kept for backwards compatibility.
 * Please use @/config/pricing instead for all new code.
 * 
 * All exports are re-exported from the unified pricing config.
 */

// Re-export everything from the unified pricing config
export {
  ADD_ON_TYPES,
  ADD_ON_PRICING,
  ADD_ON_DURATION,
  ADD_ON_RANKING_BOOST,
  ADD_ON_METADATA,
  RANKING_WEIGHTS,
  VISIBILITY_ADDONS,
  STRIPE_ADDON_PRICE_IDS,
  formatAddOnPrice,
  formatAddOnDuration,
  calculateExpirationDate,
  getRemainingTime,
  formatRemainingTime,
  getAddOnsByCategory,
  getAddOnInfo,
  getAllAddOnsInfo,
  isRankingAddOn,
  getMaxRankingBoost,
} from './pricing';

export type { AddOnType, AddOnMetadata } from './pricing';

// Legacy alias for backwards compatibility
export { STRIPE_ADDON_PRICE_IDS as STRIPE_PRICE_IDS } from './pricing';
