/*
This file contains all calculations for fix and flip analysis, currently in the analyze_property directory.
Create methods to calculate:
1. Sale proceeds (After Repair Value - Selling Costs)
2. Total Profit (Sale proceeds - Total Investment)
3. Total Return on Investment (Total Profit / Total Investment)
4. Annualized Return on Investment (Total Return on Investment / Rehab Duration)
5. Capital Needed (Total Investment - Down Payment)
6. Down Payment (Asking Price * Down Payment Percentage)
7. Rehab Duration as a number of months(assume the input is days)
8. Rehab Cost (Cost per square foot * Interior Square Footage)
9. Selling Costs (Selling Costs Percentage * After Repair Value)
10. Post tax profit (Total Profit * (1 - Tax Rate))
*/

/**
 * Calculates the selling costs.
 * Formula: sellingCosts = afterRepairValue * sellingCostsPercentage
 * @param afterRepairValue - Projected value after repairs
 * @param sellingCostsPercentage - Percentage of ARV for selling costs (default 0.06 = 6%)
 * @returns Selling costs amount
 */
export function calculateSellingCosts(
  afterRepairValue: number,
  sellingCostsPercentage: number = 0.06
): number {
  return afterRepairValue * sellingCostsPercentage;
}

/**
 * Calculates the sale proceeds.
 * Formula: saleProceeds = afterRepairValue - sellingCosts
 * @param afterRepairValue - Projected value after repairs
 * @param sellingCosts - Total selling costs
 * @returns Sale proceeds amount
 */
export function calculateSaleProceeds(
  afterRepairValue: number,
  sellingCosts: number
): number {
  return afterRepairValue - sellingCosts;
}

/**
 * Calculates the total profit.
 * Formula: totalProfit = saleProceeds - totalInvestment
 * @param saleProceeds - Proceeds from sale
 * @param totalInvestment - Total investment made
 * @returns Total profit
 */
export function calculateTotalProfit(
  saleProceeds: number,
  totalInvestment: number
): number {
  return saleProceeds - totalInvestment;
}

/**
 * Calculates the total return on investment (ROI).
 * Formula: totalROI = totalProfit / totalInvestment
 * @param totalProfit - Total profit
 * @param totalInvestment - Total investment made
 * @returns ROI as a decimal (e.g., 0.15 for 15%)
 */
export function calculateTotalROI(
  totalProfit: number,
  totalInvestment: number
): number {
  if (totalInvestment === 0) return 0;
  return totalProfit / totalInvestment;
}

/**
 * Calculates the annualized return on investment (ROI).
 * Formula: annualizedROI = totalROI / rehabDurationYears
 * @param totalROI - Total ROI (decimal)
 * @param rehabDurationMonths - Rehab duration in months
 * @returns Annualized ROI as a decimal
 */
export function calculateAnnualizedROI(
  totalROI: number,
  rehabDurationMonths: number
): number {
  if (!rehabDurationMonths || rehabDurationMonths === 0) return 0;
  return totalROI / (rehabDurationMonths / 12);
}

/**
 * Calculates the down payment.
 * Formula: downPayment = askingPrice * downPaymentPercentage
 * @param askingPrice - Property asking price
 * @param downPaymentPercentage - Percentage for down payment (default 0.20 = 20%)
 * @returns Down payment amount
 */
export function calculateDownPayment(
  askingPrice: number,
  downPaymentPercentage: number = 0.20
): number {
  return askingPrice * downPaymentPercentage;
}

/**
 * Calculates the capital needed.
 * Formula: capitalNeeded = totalInvestment - downPayment
 * @param totalInvestment - Total investment made
 * @param downPayment - Down payment amount
 * @returns Capital needed
 */
export function calculateCapitalNeeded(
  totalInvestment: number,
  downPayment: number
): number {
  return totalInvestment - downPayment;
}

/**
 * Converts rehab duration from days to months.
 * Formula: months = days / 30
 * @param rehabDurationDays - Rehab duration in days
 * @returns Rehab duration in months
 */
export function calculateRehabDurationMonths(
  rehabDurationDays: number
): number {
  return rehabDurationDays / 30;
}

/**
 * Calculates the rehab cost.
 * Formula: rehabCost = costPerSqft * interiorSqft
 * @param costPerSqft - Cost per square foot (default $50)
 * @param interiorSqft - Interior square footage
 * @returns Rehab cost
 */
export function calculateRehabCost(
  interiorSqft: number,
  costPerSqft: number = 50
): number {
  return interiorSqft * costPerSqft;
}

/**
 * Calculates the post-tax profit.
 * Formula: postTaxProfit = totalProfit * (1 - taxRate)
 * @param totalProfit - Total profit
 * @param taxRate - Tax rate (default 0.25 = 25%)
 * @returns Post-tax profit
 */
export function calculatePostTaxProfit(
  totalProfit: number,
  taxRate: number = 0.25
): number {
  return totalProfit * (1 - taxRate);
}

/**
 * Calculates the 70% rule metric for real estate investing.
 * Formula: maxPurchasePrice = (ARV × 0.70) − estimatedRepairs
 * @param afterRepairValue - After Repair Value (ARV)
 * @param estimatedRepairs - Estimated repair costs
 * @param actualPurchasePrice - Actual purchase price to compare against
 * @returns Object containing max purchase price and whether the rule passes
 */
export function calculate70PercentRule(
  afterRepairValue: number,
  estimatedRepairs: number,
  actualPurchasePrice: number
): { maxPurchasePrice: number; passes: boolean } {
  const maxPurchasePrice = (afterRepairValue * 0.70) - estimatedRepairs;
  const passes = actualPurchasePrice <= maxPurchasePrice;
  
  return {
    maxPurchasePrice,
    passes
  };
}