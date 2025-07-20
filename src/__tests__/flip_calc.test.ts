import {
  calculateSellingCosts,
  calculateSaleProceeds,
  calculateTotalProfit,
  calculateTotalROI,
  calculateAnnualizedROI,
  calculateDownPayment,
  calculateCapitalNeeded,
  calculateRehabDurationMonths,
  calculateRehabCost,
  calculatePostTaxProfit,
} from '../lib/analysis_calculations/flip_calc';

describe('flip_calc integration', () => {
  it('calculates selling costs with default percentage', () => {
    expect(calculateSellingCosts(200000)).toBeCloseTo(12000);
  });

  it('calculates sale proceeds', () => {
    expect(calculateSaleProceeds(200000, 12000)).toBe(188000);
  });

  it('calculates total profit', () => {
    expect(calculateTotalProfit(188000, 150000)).toBe(38000);
  });

  it('calculates total ROI', () => {
    expect(calculateTotalROI(38000, 150000)).toBeCloseTo(0.2533, 3);
  });

  it('calculates annualized ROI', () => {
    expect(calculateAnnualizedROI(0.24, 6)).toBeCloseTo(0.48);
  });

  it('calculates down payment with default percentage', () => {
    expect(calculateDownPayment(300000)).toBe(60000);
  });

  it('calculates capital needed', () => {
    expect(calculateCapitalNeeded(150000, 60000)).toBe(90000);
  });

  it('converts rehab duration from days to months', () => {
    expect(calculateRehabDurationMonths(90)).toBeCloseTo(3);
  });

  it('calculates rehab cost with default cost per sqft', () => {
    expect(calculateRehabCost(2000)).toBe(100000);
  });

  it('calculates post-tax profit with default tax rate', () => {
    expect(calculatePostTaxProfit(40000)).toBe(30000);
  });
}); 