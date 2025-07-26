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
  calculate70PercentRule,
  calculateLoanAmount,
  calculateMonthlyMortgagePayment,
  calculateTotalInterestPaid,
  calculateTotalLoanCosts,
  calculateLoanToValueRatio,
  calculateDebtToIncomeRatio,
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

describe('calculate70PercentRule', () => {
  it('should calculate max purchase price correctly', () => {
    const result = calculate70PercentRule(200000, 30000, 120000);
    expect(result.maxPurchasePrice).toBe(110000); // (200000 * 0.70) - 30000
    expect(result.passes).toBe(false); // 120000 > 110000
  });

  it('should pass when purchase price is within 70% rule', () => {
    const result = calculate70PercentRule(200000, 30000, 100000);
    expect(result.maxPurchasePrice).toBe(110000); // (200000 * 0.70) - 30000
    expect(result.passes).toBe(true); // 100000 <= 110000
  });

  it('should pass when purchase price equals max purchase price', () => {
    const result = calculate70PercentRule(200000, 30000, 110000);
    expect(result.maxPurchasePrice).toBe(110000);
    expect(result.passes).toBe(true); // 110000 <= 110000
  });

  it('should handle zero values', () => {
    const result = calculate70PercentRule(0, 0, 0);
    expect(result.maxPurchasePrice).toBe(0);
    expect(result.passes).toBe(true); // 0 <= 0
  });
});

describe('financing calculations', () => {
  it('calculates loan amount with default down payment percentage', () => {
    expect(calculateLoanAmount(300000)).toBe(240000); // 300000 * (1 - 0.20)
  });

  it('calculates loan amount with custom down payment percentage', () => {
    expect(calculateLoanAmount(300000, 0.25)).toBe(225000); // 300000 * (1 - 0.25)
  });

  it('calculates monthly mortgage payment', () => {
    const payment = calculateMonthlyMortgagePayment(240000, 0.05, 30);
    expect(payment).toBeCloseTo(1288.37, 1); // Approximate monthly payment for 240k loan at 5% for 30 years
  });

  it('calculates total interest paid', () => {
    const totalInterest = calculateTotalInterestPaid(1288.37, 30, 240000);
    expect(totalInterest).toBeCloseTo(223813.2, 0); // (1288.37 * 360) - 240000
  });

  it('calculates total loan costs', () => {
    const totalCosts = calculateTotalLoanCosts(223813.2, 5000);
    expect(totalCosts).toBe(228813.2); // 223813.2 + 5000
  });

  it('calculates loan-to-value ratio', () => {
    expect(calculateLoanToValueRatio(240000, 300000)).toBe(0.8); // 240000 / 300000
  });

  it('calculates debt-to-income ratio', () => {
    const dti = calculateDebtToIncomeRatio(500, 1288.37, 8000);
    expect(dti).toBeCloseTo(0.2235, 3); // (500 + 1288.37) / 8000
  });

  it('handles zero values in loan calculations', () => {
    expect(calculateLoanAmount(0)).toBe(0);
    expect(calculateMonthlyMortgagePayment(0, 0.05, 30)).toBe(0);
    expect(calculateTotalInterestPaid(0, 30, 0)).toBe(0);
    expect(calculateLoanToValueRatio(0, 0)).toBe(0);
    expect(calculateDebtToIncomeRatio(0, 0, 0)).toBe(0);
  });
}); 