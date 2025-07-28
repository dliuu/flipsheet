'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { useAuth } from '@/lib/auth/useAuth';
import { getPropertyImages } from '@/lib/read_property_images';
import { writeFlipAnalysis, queryFlipAnalysis } from '@/lib/database';
import { Property, PropertyImage } from '@/types/database';
import { supabase } from '@/supabaseClient';
import {
  calculateSellingCosts,
  calculateSaleProceeds,
  calculateTotalProfit,
  calculateTotalROI,
  calculateAnnualizedROI,
  calculateDownPayment,
  calculateCapitalNeeded,
  calculatePostTaxProfit,
  calculate70PercentRule,
  calculateLoanAmount,
  calculateMonthlyMortgagePayment,
  calculateTotalInterestPaid,
  calculateTotalLoanCosts,
  calculateLoanToValueRatio,
  calculateDebtToIncomeRatio,
  calculateLoanToCostRatio,
  calculateReturnOnEquity,
  calculateBreakEvenAnalysis,
} from '@/lib/analysis_calculations/flip_calc';

// Utility to determine if any input has decimals
function shouldShowDecimals(...values: number[]): boolean {
  return values.some(val => !Number.isInteger(val));
}

// Retry utility function with exponential backoff
const retryWithBackoff = async (fn: () => Promise<unknown>, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

export default function AnalyzePropertyPage() {
  const searchParams = useSearchParams();
  const propertyParam = searchParams.get('property');
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<Property | null>(null);
  const [propertyImages, setPropertyImages] = useState<PropertyImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [userContact, setUserContact] = useState('');
  const [message, setMessage] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([]);

  // Add degraded mode state
  const [isDegradedMode, setIsDegradedMode] = useState(false);

  // Editable property financial fields (default to property values or 0)
  const [purchasePrice, setPurchasePrice] = useState(property?.asking_price || 0);
  const [closingCosts, setClosingCosts] = useState(property?.estimated_closing_costs || 0);
  const [rehabCosts, setRehabCosts] = useState(property?.rehab_cost || 0);
  const [afterRepairValue, setAfterRepairValue] = useState(property?.estimated_after_repair_value || 0);
  const [interiorSqft, setInteriorSqft] = useState(property?.interior_sqft || 0);
  const [taxRate, setTaxRate] = useState(0.25); // Default 25%

  // Add state for months held (default 2)
  const [monthsHeld, setMonthsHeld] = useState(2);

  // Loan evaluation state variables
  const [showLoanEvaluation, setShowLoanEvaluation] = useState(false);
  const [downPaymentPercentage, setDownPaymentPercentage] = useState(20); // Default 20%
  const [annualInterestRate, setAnnualInterestRate] = useState(7.5); // Default 7.5%
  const [loanTermYears, setLoanTermYears] = useState(30); // Default 30 years
  const [underwritingProcessingFees, setUnderwritingProcessingFees] = useState(0);
  const [appraisalFee, setAppraisalFee] = useState(0);
  const [projectedLoanExtensionFees, setProjectedLoanExtensionFees] = useState(0);
  const [closingLoanFees, setClosingLoanFees] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [otherMonthlyDebt, setOtherMonthlyDebt] = useState(0);

  // Financing state
  const [isFinancing, setIsFinancing] = useState(false);

  // Track original values to detect changes
  const [originalValues, setOriginalValues] = useState({
    purchasePrice: 0,
    closingCosts: 0,
    rehabCosts: 0,
    afterRepairValue: 0,
    interiorSqft: 0,
    taxRate: 0.25,
    propertyTaxesAnnual: '',
    insuranceCostsAnnual: '',
    hoaFeesAnnual: '',
    utilitiesCostsAnnual: '',
    accountingLegalFeesAnnual: '',
    otherHoldingFeesAnnual: '',
    downPaymentPercentage: 20,
    annualInterestRate: 7.5,
    loanTermYears: 30,
    underwritingProcessingFees: 0,
    appraisalFee: 0,
    projectedLoanExtensionFees: 0,
    closingLoanFees: 0,
    monthlyIncome: 0,
    otherMonthlyDebt: 0,
  });

  // Save functionality states
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [propertyLoaded, setPropertyLoaded] = useState(false);

  // Calculation results
  const [sellingCosts, setSellingCosts] = useState(0);
  const [saleProceeds, setSaleProceeds] = useState(0);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [downPayment, setDownPayment] = useState(0);
  const [capitalNeeded, setCapitalNeeded] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalROI, setTotalROI] = useState(0);
  const [annualizedROI, setAnnualizedROI] = useState(0);
  const [postTaxProfit, setPostTaxProfit] = useState(0);
  const [holdingCosts, setHoldingCosts] = useState(0);
  const [financingCosts, setFinancingCosts] = useState(0);

  // Metrics calculation results
  const [seventyPercentRule, setSeventyPercentRule] = useState({ maxPurchasePrice: 0, passes: false });

  // Loan calculation results
  const [loanAmount, setLoanAmount] = useState(0);
  const [monthlyMortgagePayment, setMonthlyMortgagePayment] = useState(0);
  const [totalInterestPaid, setTotalInterestPaid] = useState(0);
  const [totalLoanCosts, setTotalLoanCosts] = useState(0);
  const [loanToValueRatio, setLoanToValueRatio] = useState(0);
  const [debtToIncomeRatio, setDebtToIncomeRatio] = useState(0);

  // New metrics calculation results
  const [loanToCostRatio, setLoanToCostRatio] = useState(0);
  const [returnOnEquity, setReturnOnEquity] = useState(0);
  const [breakEvenAnalysis, setBreakEvenAnalysis] = useState({
    breakEvenARV: 0,
    rehabCostsMargin: 0,
    holdingCostsMargin: 0,
    financingCostsMargin: 0
  });

  // Add at the top, after other useState hooks
  const [propertyTaxesMode, setPropertyTaxesMode] = useState<'annual' | 'monthly'>('annual');
  const [insuranceCostsMode, setInsuranceCostsMode] = useState<'annual' | 'monthly'>('annual');
  const [hoaFeesMode, setHoaFeesMode] = useState<'annual' | 'monthly'>('annual');
  const [utilitiesCostsMode, setUtilitiesCostsMode] = useState<'annual' | 'monthly'>('annual');
  const [accountingLegalFeesMode, setAccountingLegalFeesMode] = useState<'annual' | 'monthly'>('annual');
  const [otherHoldingFeesMode, setOtherHoldingFeesMode] = useState<'annual' | 'monthly'>('annual');

  // For each holding cost input, keep only one state: the annual value as a string
  const [propertyTaxesAnnual, setPropertyTaxesAnnual] = useState('');
  const [insuranceCostsAnnual, setInsuranceCostsAnnual] = useState('');
  const [hoaFeesAnnual, setHoaFeesAnnual] = useState('');
  const [utilitiesCostsAnnual, setUtilitiesCostsAnnual] = useState('');
  const [accountingLegalFeesAnnual, setAccountingLegalFeesAnnual] = useState('');
  const [otherHoldingFeesAnnual, setOtherHoldingFeesAnnual] = useState('');

  // For calculations, use Number(annual) || 0
  const propertyTaxes = Number(propertyTaxesAnnual) || 0;
  const insuranceCosts = Number(insuranceCostsAnnual) || 0;
  const hoaFees = Number(hoaFeesAnnual) || 0;
  const utilitiesCosts = Number(utilitiesCostsAnnual) || 0;
  const accountingLegalFees = Number(accountingLegalFeesAnnual) || 0;
  const otherHoldingFees = Number(otherHoldingFeesAnnual) || 0;

  // For UI, derive the value to show in the input based on the mode
  function getDisplayValue(annualValue: string, mode: 'annual' | 'monthly'): string {
    if (!annualValue) return '';
    const num = Number(annualValue);
    if (isNaN(num)) return '';
    return mode === 'annual' ? annualValue : (num / 12).toFixed(2).replace(/\.00$/, '');
  }

  // For onChange, always update the annual value
  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement>,
    mode: 'annual' | 'monthly',
    setAnnual: (val: string) => void
  ): void {
    const val = e.target.value;
    if (!/^\d*(\.\d{0,2})?$/.test(val)) return; // allow only numbers and up to 2 decimals
    if (mode === 'annual') {
      setAnnual(val);
    } else {
      // monthly mode: store as annual
      const num = Number(val);
      if (val === '') setAnnual('');
      else if (!isNaN(num)) setAnnual((num * 12).toString());
    }
  }

  function handleInputBlur(
    annualValue: string,
    setAnnual: (val: string) => void,
    mode: 'annual' | 'monthly'
  ): void {
    if (!annualValue) return;
    const num = Number(annualValue);
    if (isNaN(num)) setAnnual('');
    else setAnnual(num.toString());
  }

  // Compute showDecimals flag based on all relevant inputs
  const showDecimals = shouldShowDecimals(
    purchasePrice, closingCosts, rehabCosts, afterRepairValue, interiorSqft, taxRate * 100
  );

  // Recalculate all outputs when any input changes
  useEffect(() => {
    const _sellingCosts = calculateSellingCosts(afterRepairValue);
    setSellingCosts(_sellingCosts);

    const _saleProceeds = calculateSaleProceeds(afterRepairValue, _sellingCosts);
    setSaleProceeds(_saleProceeds);

    const _downPayment = calculateDownPayment(purchasePrice, downPaymentPercentage / 100);
    setDownPayment(_downPayment);

    // Calculate invested capital based on financing status
    let _totalInvestment;
    if (isFinancing) {
      // When using financing, invested capital is just the down payment
      _totalInvestment = _downPayment;
    } else {
      // When not using financing, invested capital is the purchase price + closing costs (rehab costs are separate)
      _totalInvestment = purchasePrice + closingCosts;
    }
    setTotalInvestment(_totalInvestment);

    // Calculate capital needed based on financing status
    let _capitalNeeded;
    if (isFinancing) {
      // When using financing, capital needed is just the down payment
      _capitalNeeded = _downPayment;
    } else {
      // When not using financing, capital needed is the full purchase price
      _capitalNeeded = purchasePrice;
    }
    setCapitalNeeded(_capitalNeeded);

    // Calculate holding costs
    const annualSum = propertyTaxes + insuranceCosts + hoaFees + utilitiesCosts + accountingLegalFees + otherHoldingFees;
    const _holdingCosts = (monthsHeld / 12) * annualSum;
    setHoldingCosts(_holdingCosts);

    // Calculate financing costs if financing is enabled
    let _financingCosts = 0;
    if (isFinancing) {
      // Calculate total interest paid over the holding period using simple interest
      const _loanAmount = calculateLoanAmount(purchasePrice, downPaymentPercentage / 100);
      const annualInterest = _loanAmount * (annualInterestRate / 100);
      const totalInterestPaid = annualInterest * (monthsHeld / 12);
      
      // Add all loan-related fees to the financing costs
      _financingCosts = totalInterestPaid + underwritingProcessingFees + appraisalFee + projectedLoanExtensionFees + closingLoanFees;
    }
    setFinancingCosts(_financingCosts);

    // Calculate loan amount (needed for profit calculation)
    const _loanAmount = calculateLoanAmount(purchasePrice, downPaymentPercentage / 100);
    setLoanAmount(_loanAmount);

    // Update total profit to subtract holding costs, financing costs, loan amount, and rehab costs
    let _totalProfit;
    if (isFinancing) {
      // When financing, subtract loan amount, down payment, and rehab costs from sale proceeds
      _totalProfit = _saleProceeds - _loanAmount - _downPayment - rehabCosts - _holdingCosts - _financingCosts;
    } else {
      // When not financing, subtract rehab costs from sale proceeds
      _totalProfit = _saleProceeds - rehabCosts - _totalInvestment - _holdingCosts - _financingCosts;
    }
    setTotalProfit(_totalProfit);

    const _totalROI = calculateTotalROI(_totalProfit, _totalInvestment);
    setTotalROI(_totalROI);

    // Use property.rehab_duration_months if available, else 0
    const months = property?.rehab_duration_months || 0;
    const _annualizedROI = calculateAnnualizedROI(_totalROI, months);
    setAnnualizedROI(_annualizedROI);

    const _postTaxProfit = calculatePostTaxProfit(_totalProfit, taxRate);
    setPostTaxProfit(_postTaxProfit);

    // Calculate 70% rule metric
    const _seventyPercentRule = calculate70PercentRule(afterRepairValue, rehabCosts, purchasePrice);
    setSeventyPercentRule(_seventyPercentRule);

    // Calculate remaining loan metrics (loan amount already calculated above)
    const _monthlyMortgagePayment = calculateMonthlyMortgagePayment(_loanAmount, annualInterestRate / 100, loanTermYears);
    setMonthlyMortgagePayment(_monthlyMortgagePayment);

    // Calculate total interest paid using simple interest for display
    let _totalInterestPaid = 0;
    if (isFinancing) {
      const annualInterest = _loanAmount * (annualInterestRate / 100);
      _totalInterestPaid = annualInterest * (monthsHeld / 12);
    }
    setTotalInterestPaid(_totalInterestPaid);

    const _totalLoanCosts = calculateTotalLoanCosts(_totalInterestPaid, underwritingProcessingFees + appraisalFee + projectedLoanExtensionFees + closingLoanFees);
    setTotalLoanCosts(_totalLoanCosts);

    const _loanToValueRatio = calculateLoanToValueRatio(_loanAmount, purchasePrice);
    setLoanToValueRatio(_loanToValueRatio);

    const _debtToIncomeRatio = calculateDebtToIncomeRatio(otherMonthlyDebt, _monthlyMortgagePayment, monthlyIncome);
    setDebtToIncomeRatio(_debtToIncomeRatio);

    // Calculate new metrics
    const _loanToCostRatio = calculateLoanToCostRatio(_loanAmount, purchasePrice, rehabCosts);
    setLoanToCostRatio(_loanToCostRatio);

    // Calculate cash invested (down payment + rehab costs + other costs)
    const cashInvested = _downPayment + rehabCosts + closingCosts;
    const _returnOnEquity = calculateReturnOnEquity(_totalProfit, cashInvested);
    setReturnOnEquity(_returnOnEquity);

    // Calculate break-even analysis
    const _breakEvenAnalysis = calculateBreakEvenAnalysis(
      afterRepairValue,
      purchasePrice,
      rehabCosts,
      _holdingCosts,
      _financingCosts,
      _sellingCosts,
      isFinancing
    );
    setBreakEvenAnalysis(_breakEvenAnalysis);
  }, [purchasePrice, closingCosts, rehabCosts, afterRepairValue, interiorSqft, taxRate, property?.rehab_duration_months, monthsHeld, propertyTaxes, insuranceCosts, hoaFees, utilitiesCosts, accountingLegalFees, otherHoldingFees, downPaymentPercentage, annualInterestRate, loanTermYears, underwritingProcessingFees, appraisalFee, projectedLoanExtensionFees, closingLoanFees, monthlyIncome, otherMonthlyDebt, isFinancing]);

  // Check if current user is the property owner
  const isPropertyOwner = user && property && user.id === property.user_id;

  useEffect(() => {
    checkConnection();
  }, []);

  // Monitor authentication state changes
  useEffect(() => {
    const handleAuthStateChange = async () => {
      // Re-check connection when auth state changes
      await checkConnection();
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadPropertyAndAnalysis = async () => {
      if (propertyParam) {
        try {
          const propertyData = JSON.parse(decodeURIComponent(propertyParam));
          setProperty(propertyData);
          fetchPropertyImages(propertyData.id);

          // Try to load flip_analysis for this property with retry logic
          let analysis: any = null;
          try {
            analysis = await retryWithBackoff(async () => {
              return await queryFlipAnalysis(propertyData.id);
            });
          } catch (e) {
            console.warn('Failed to load flip analysis after retries:', e);
            analysis = null;
          }

          setPurchasePrice(analysis?.purchase_price ?? 0);
          setClosingCosts(analysis?.estimated_purchase_costs ?? 0);
          setRehabCosts(analysis?.estimated_rehab_costs ?? 0);
          setAfterRepairValue(analysis?.after_repair_value ?? 0);
          setInteriorSqft(analysis?.after_repair_sqft ?? 0);
          setTaxRate(
            typeof analysis?.tax_rate === 'number'
              ? analysis.tax_rate / 100
              : 0.25 // default to 25% if not present
          );

          setOriginalValues({
            purchasePrice: analysis?.purchase_price ?? 0,
            closingCosts: analysis?.estimated_purchase_costs ?? 0,
            rehabCosts: analysis?.estimated_rehab_costs ?? 0,
            afterRepairValue: analysis?.after_repair_value ?? 0,
            interiorSqft: analysis?.after_repair_sqft ?? 0,
            taxRate:
              typeof analysis?.tax_rate === 'number'
                ? analysis.tax_rate / 100
                : 0.25,
            propertyTaxesAnnual,
            insuranceCostsAnnual,
            hoaFeesAnnual,
            utilitiesCostsAnnual,
            accountingLegalFeesAnnual,
            otherHoldingFeesAnnual,
            downPaymentPercentage: 20,
            annualInterestRate: 7.5,
            loanTermYears: 30,
            underwritingProcessingFees: 0,
            appraisalFee: 0,
            projectedLoanExtensionFees: 0,
            closingLoanFees: 0,
            monthlyIncome: 0,
            otherMonthlyDebt: 0,
          });

          setPropertyLoaded(true);
        } catch (parseError) {
          setError('Invalid property data');
          setLoading(false);
        }
      } else {
        setError('Property is required');
        setLoading(false);
      }
    };
    loadPropertyAndAnalysis();
  }, [propertyParam]);

  // Detect changes by comparing current values with original values
  useEffect(() => {
    // Only detect changes after property has been loaded
    if (!propertyLoaded) return;
    
    const changes = 
      purchasePrice !== originalValues.purchasePrice ||
      closingCosts !== originalValues.closingCosts ||
      rehabCosts !== originalValues.rehabCosts ||
      afterRepairValue !== originalValues.afterRepairValue ||
      interiorSqft !== originalValues.interiorSqft ||
      taxRate !== originalValues.taxRate ||
      propertyTaxesAnnual !== originalValues.propertyTaxesAnnual ||
      insuranceCostsAnnual !== originalValues.insuranceCostsAnnual ||
      hoaFeesAnnual !== originalValues.hoaFeesAnnual ||
      utilitiesCostsAnnual !== originalValues.utilitiesCostsAnnual ||
      accountingLegalFeesAnnual !== originalValues.accountingLegalFeesAnnual ||
      otherHoldingFeesAnnual !== originalValues.otherHoldingFeesAnnual ||
      downPaymentPercentage !== originalValues.downPaymentPercentage ||
      annualInterestRate !== originalValues.annualInterestRate ||
      loanTermYears !== originalValues.loanTermYears ||
      underwritingProcessingFees !== originalValues.underwritingProcessingFees ||
      appraisalFee !== originalValues.appraisalFee ||
      projectedLoanExtensionFees !== originalValues.projectedLoanExtensionFees ||
      monthlyIncome !== originalValues.monthlyIncome ||
      otherMonthlyDebt !== originalValues.otherMonthlyDebt;
    
    setHasChanges(changes);
    
    // Check if financing inputs have been changed
    const financingChanged = 
      downPaymentPercentage !== originalValues.downPaymentPercentage ||
      annualInterestRate !== originalValues.annualInterestRate ||
      loanTermYears !== originalValues.loanTermYears ||
      underwritingProcessingFees !== originalValues.underwritingProcessingFees ||
      appraisalFee !== originalValues.appraisalFee ||
      projectedLoanExtensionFees !== originalValues.projectedLoanExtensionFees;
    
    setIsFinancing(financingChanged);
  }, [
    purchasePrice, 
    closingCosts, 
    rehabCosts, 
    afterRepairValue, 
    interiorSqft, 
    taxRate, 
    propertyTaxesAnnual, 
    insuranceCostsAnnual, 
    hoaFeesAnnual, 
    utilitiesCostsAnnual, 
    accountingLegalFeesAnnual, 
    otherHoldingFeesAnnual, 
    downPaymentPercentage, 
    annualInterestRate, 
    loanTermYears, 
    underwritingProcessingFees, 
    appraisalFee, 
    projectedLoanExtensionFees, 
    monthlyIncome, 
    otherMonthlyDebt, 
    propertyLoaded,
    originalValues.purchasePrice,
    originalValues.closingCosts,
    originalValues.rehabCosts,
    originalValues.afterRepairValue,
    originalValues.interiorSqft,
    originalValues.taxRate,
    originalValues.propertyTaxesAnnual,
    originalValues.insuranceCostsAnnual,
    originalValues.hoaFeesAnnual,
    originalValues.utilitiesCostsAnnual,
    originalValues.accountingLegalFeesAnnual,
    originalValues.otherHoldingFeesAnnual,
    originalValues.downPaymentPercentage,
    originalValues.annualInterestRate,
    originalValues.loanTermYears,
    originalValues.underwritingProcessingFees,
    originalValues.appraisalFee,
    originalValues.projectedLoanExtensionFees,
    originalValues.monthlyIncome,
    originalValues.otherMonthlyDebt
  ]);

  // Error handling utility
  const handleError = (error: unknown, context: string) => {
    console.warn(`${context} failed:`, error);
    
    // If it's an auth error, enable degraded mode
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('token')) {
      setIsDegradedMode(true);
    }
  };

  const checkConnection = async () => {
    try {
      const result = await retryWithBackoff(async () => {
        return await getSession();
      }) as { session: any; error: any };
      
      if (result.error) {
        handleError(result.error, 'Connection check');
        setIsConnected(false);
      } else {
        setIsConnected(!!result.session);
        setIsDegradedMode(false); // Reset degraded mode on success
      }
    } catch (error) {
      handleError(error, 'Connection check');
      setIsConnected(false);
    }
  };

  const fetchPropertyImages = async (propertyId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch property images with retry logic
      try {
        const images = await retryWithBackoff(async () => {
          return await getPropertyImages(propertyId);
        }) as PropertyImage[];
        setPropertyImages(images);
      } catch (imageError) {
        console.warn('Failed to load property images after retries:', imageError);
        // Continue without images
      }
      
    } catch (error: any) {
      setError(error.message || 'Failed to load property images');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedImage(index);
  };

  const handleContactSeller = () => {
    setShowContactModal(true);
  };

  const handleCloseModal = () => {
    setShowContactModal(false);
    setUserContact('');
    setMessage('');
  };

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement email functionality
    handleCloseModal();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Filter for image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // Limit to 10 additional photos
    const remainingSlots = 10 - uploadedPhotos.length;
    const newPhotos = imageFiles.slice(0, remainingSlots);
    
    if (newPhotos.length > 0) {
      const updatedPhotos = [...uploadedPhotos, ...newPhotos];
      setUploadedPhotos(updatedPhotos);
      
      // Create preview URLs
      const newUrls = newPhotos.map(file => URL.createObjectURL(file));
      setUploadedPhotoUrls(prev => [...prev, ...newUrls]);
    }
  };

  const removeUploadedPhoto = (index: number) => {
    const updatedPhotos = uploadedPhotos.filter((_, i) => i !== index);
    const updatedUrls = uploadedPhotoUrls.filter((_, i) => i !== index);
    
    setUploadedPhotos(updatedPhotos);
    setUploadedPhotoUrls(updatedUrls);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveChanges = async () => {
    if (!property || !hasChanges) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      await retryWithBackoff(async () => {
        return await writeFlipAnalysis(property.id, {
          purchasePrice,
          closingCosts,
          rehabCosts,
          afterRepairValue,
          interiorSqft,
          taxRate,
        });
      });
      
      // Update original values to reflect saved state
      setOriginalValues({
        purchasePrice,
        closingCosts,
        rehabCosts,
        afterRepairValue,
        interiorSqft,
        taxRate,
        propertyTaxesAnnual,
        insuranceCostsAnnual,
        hoaFeesAnnual,
        utilitiesCostsAnnual,
        accountingLegalFeesAnnual,
        otherHoldingFeesAnnual,
        downPaymentPercentage,
        annualInterestRate,
        loanTermYears,
        underwritingProcessingFees,
        appraisalFee,
        projectedLoanExtensionFees,
        closingLoanFees,
        monthlyIncome,
        otherMonthlyDebt,
      });
      
      setHasChanges(false);
      setIsFinancing(false); // Reset financing state when changes are saved
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: unknown) {
      console.error('Error saving changes:', error);
      handleError(error, 'Save changes');
      // You could add a toast notification here for error handling
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-rotate images every 7 seconds if there are images
  useEffect(() => {
    if (propertyImages.length === 0) return;
    
    const interval = setInterval(() => {
      setSelectedImage((prevIndex) => (prevIndex + 1) % propertyImages.length);
    }, 7000);

    // Clear interval when component unmounts or when images change
    return () => {
      clearInterval(interval);
    };
  }, [propertyImages.length, selectedImage]); // Add selectedImage to dependencies

  // Loading state
  if (loading) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{fontFamily: 'Inter, "Noto Sans", sans-serif'}}>
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
              <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Loading property...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !property) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{fontFamily: 'Inter, "Noto Sans", sans-serif'}}>
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600 mb-2">Error</div>
                  <div className="text-gray-600">{error || 'Property not found'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate financial metrics
  const profitPerSqft = property?.interior_sqft && property.interior_sqft > 0 
    ? totalProfit / property.interior_sqft 
    : 0;

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{fontFamily: 'Inter, "Noto Sans", sans-serif'}}>
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            {/* Property Title and Fix and Flip Tag Row */}
            <div className="flex justify-between items-start px-4 pt-5 pb-3">
              <h1 className="text-[#111518] text-[22px] font-bold leading-tight tracking-[-0.015em] flex-1">
                {property?.title}
              </h1>
              <div className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#f0f2f5] text-[#111518] text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#e4e6e9] transition-colors ml-4">
                <span className="truncate">Fix and Flip</span>
              </div>
            </div>

            {/* Property Description */}
            {property?.description && (
              <p className="text-[#111518] text-base font-normal leading-normal pb-3 pt-1 px-4">
                {property.description}
              </p>
            )}

            {/* Degraded Mode Warning */}
            {isDegradedMode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4 mx-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      Connection issues detected. Some features may be limited. Please refresh the page if problems persist.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="px-4 py-6">
              <div className="w-full gap-1 overflow-hidden bg-gray-50 rounded-lg p-4 max-w-[864px]">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[#111518] text-sm font-medium">Cash Invested</span>
                      <span className="text-red-600 text-sm font-bold">{capitalNeeded.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: showDecimals ? 2 : 0, minimumFractionDigits: showDecimals ? 2 : 0 })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#111518] text-sm font-medium">Total Profit</span>
                      <span className="text-green-600 text-sm font-bold">{totalProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: showDecimals ? 2 : 0, minimumFractionDigits: showDecimals ? 2 : 0 })}</span>
                    </div>
                    {/* Post-Tax Profit */}
                    <div className="flex justify-between items-center">
                      <span className="text-[#111518] text-sm font-medium">Post-Tax Profit</span>
                      <span className="text-green-600 text-sm font-bold">{postTaxProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: showDecimals ? 2 : 0, minimumFractionDigits: showDecimals ? 2 : 0 })}</span>
                    </div>

                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[#111518] text-sm font-medium">% ROI</span>
                      <span className="text-[#111518] text-sm font-bold">{(totalROI * 100).toLocaleString('en-US', { maximumFractionDigits: showDecimals ? 2 : 0, minimumFractionDigits: showDecimals ? 2 : 0 }) + '%'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#111518] text-sm font-medium">% Annualized ROI</span>
                      <span className="text-[#111518] text-sm font-bold">{(annualizedROI * 100).toLocaleString('en-US', { maximumFractionDigits: showDecimals ? 2 : 0, minimumFractionDigits: showDecimals ? 2 : 0 }) + '%'}</span>
                    </div>
                    {/* Months Held */}
                    <div className="flex justify-between items-center">
                      <span className="text-[#111518] text-sm font-medium">Months Held</span>
                      <span className="text-[#111518] text-sm font-bold">{monthsHeld}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Image */}
            {propertyImages.length > 0 && (
              <div className="flex w-full grow bg-white @container py-3 px-4">
                <div className="w-full gap-1 overflow-hidden bg-white @[480px]:gap-2 aspect-[3/2] flex max-w-[864px]">
                  <div
                    className="w-full bg-center bg-no-repeat bg-cover aspect-auto rounded-none flex-1 transition-all duration-700 ease-in-out"
                    style={{backgroundImage: `url("${propertyImages[selectedImage]?.image_url}")`}}
                  ></div>
                </div>
              </div>
            )}

            {/* Image Gallery */}
            <div className="flex overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 mt-6">
              <div className="flex items-stretch gap-3">
                {propertyImages.map((image, index) => (
                  <div key={image.id} className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-36 flex-shrink-0">
                    <div
                      className={`w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex flex-col cursor-pointer transition-all duration-200 hover:scale-105 ${
                        selectedImage === index ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                      }`}
                      style={{backgroundImage: `url("${image.image_url}")`}}
                      onClick={() => handleImageClick(index)}
                    ></div>
                    <p className="text-[#111518] text-base font-medium leading-normal">Image {index + 1}</p>
                  </div>
                ))}
                
                {/* Uploaded Photos */}
                {uploadedPhotoUrls.map((url, index) => (
                  <div key={`uploaded-${index}`} className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-36 flex-shrink-0">
                    <div className="relative group">
                      <div
                        className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex flex-col cursor-pointer transition-all duration-200 hover:scale-105"
                        style={{backgroundImage: `url("${url}")`}}
                      ></div>
                      <button
                        type="button"
                        onClick={() => removeUploadedPhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-[#111518] text-base font-medium leading-normal">Uploaded {index + 1}</p>
                  </div>
                ))}
                
                {/* Upload Button */}
                {uploadedPhotos.length < 10 && (
                  <div className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-36 flex-shrink-0">
                    <div 
                      className="w-full aspect-video bg-[#f1f2f4] border-2 border-dashed border-[#dde1e3] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:bg-[#e5e7eb] hover:border-[#c1c5c9]"
                      onClick={handleUploadClick}
                    >
                      <div className="text-center space-y-2">
                        <div className="text-2xl text-[#6a7681]">+</div>
                        <div className="text-sm text-[#6a7681] font-medium">Add Photo</div>
                      </div>
                    </div>
                    <p className="text-[#111518] text-base font-medium leading-normal">Upload</p>
                  </div>
                )}
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Property Details */}
            <h3 className="text-[#111518] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Property Details</h3>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="pb-2">
                <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Address</p>
                <p className="text-[#111518] text-sm font-normal leading-normal">{property?.address}</p>
              </div>
              {property?.bedrooms && (
                <div className="pb-2">
                  <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Bedrooms</p>
                  <p className="text-[#111518] text-sm font-normal leading-normal">{property.bedrooms}</p>
                </div>
              )}
              {property?.bathrooms && (
                <div className="pb-2">
                  <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Bathrooms</p>
                  <p className="text-[#111518] text-sm font-normal leading-normal">{property.bathrooms}</p>
                </div>
              )}
              {property?.interior_sqft && (
                <div className="pb-2">
                  <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Interior Square Footage</p>
                  <p className="text-[#111518] text-sm font-normal leading-normal">{property.interior_sqft.toLocaleString()} sq ft</p>
                </div>
              )}
              {property?.lot_sqft && (
                <div className="pb-2">
                  <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Lot Square Footage</p>
                  <p className="text-[#111518] text-sm font-normal leading-normal">{property.lot_sqft.toLocaleString()} sq ft</p>
                </div>
              )}
            </div>

            {/* Purchasing Costs */}
            <h3 className="text-[#111518] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Purchasing Costs</h3>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                  Purchase Price
                  <span className="relative group">
                    <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Total cost to purchase the property
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </span>
                </label>
                <input 
                  type="number" 
                  value={purchasePrice}
                  onChange={e => setPurchasePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                  Closing Costs
                  <span className="relative group">
                    <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Transaction fees, title insurance, and escrow costs
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </span>
                </label>
                <input 
                  type="number" 
                  value={closingCosts}
                  onChange={e => setClosingCosts(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                  Rehab Costs
                  <span className="relative group">
                    <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Estimated renovation and repair expenses
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </span>
                </label>
                <input 
                  type="number" 
                  value={rehabCosts}
                  onChange={e => setRehabCosts(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                  Other Costs
                  <span className="relative group">
                    <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Additional purchase-related expenses
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </span>
                </label>
                <input 
                  type="number" 
                  placeholder="$0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
            </div>

            {/* After Repair Valuation */}
            <h3 className="text-[#111518] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">After Repair Valuation</h3>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                  After Repair Value
                  <span className="relative group">
                    <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Estimated property value after renovations
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </span>
                </label>
                <input 
                  type="number" 
                  value={afterRepairValue}
                  onChange={e => setAfterRepairValue(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                  After Repair Square Footage
                  <span className="relative group">
                    <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Total livable area after renovations
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </span>
                </label>
                <input 
                  type="number" 
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                  ARV Per Square Foot
                  <span className="relative group">
                    <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Value per square foot after renovations
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </span>
                </label>
                <input 
                  type="number" 
                  placeholder="$0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                  Market Variance %
                  <span className="relative group">
                    <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Expected market fluctuation percentage
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </span>
                </label>
                <input 
                  type="number" 
                  placeholder="0%"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
            </div>

            {/* Loan Evaluation */}
            {!showLoanEvaluation && (
              <div className="px-4 pb-4 pt-4">
                <button
                  onClick={() => setShowLoanEvaluation(true)}
                  className="flex min-w-[200px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-[#0b80ee] text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-[#0a6fd8] transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="truncate">Add Financing</span>
                </button>
              </div>
            )}
            
            {showLoanEvaluation && (
              <div>
                {/* Financing Header */}
                <h3 className="text-[#111518] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Financing</h3>
                {/* Months Held Slider - Only show in financing section */}
                <div className="px-4 pb-4 col-span-2">
                  <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                    Months Held
                    <span className="relative group">
                      <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        How many months you expect to hold the property before selling. Impacts holding costs and ROI calculations.
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </span>
                  </label>
                  <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4">
                    <input
                      type="range"
                      min={0.5}
                      max={24}
                      step={0.5}
                      value={monthsHeld}
                      onChange={e => setMonthsHeld(Number(e.target.value))}
                      className="w-full accent-blue-500 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-lg h-2"
                      aria-label="Months Held"
                      style={{ background: 'linear-gradient(90deg, #e0e7ef 0%, #f8fafc 100%)' }}
                    />
                    <span className="text-[#111518] text-sm font-medium w-24 text-center bg-white border border-gray-200 rounded-lg py-1 shadow-sm">{monthsHeld} months</span>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="pb-2">
                  <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                    Down Payment %
                    <span className="relative group">
                      <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Percentage of purchase price for down payment. Standard is 20% for conventional loans.
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </span>
                  </label>
                  <input 
                    type="number" 
                    value={downPaymentPercentage}
                    onChange={e => setDownPaymentPercentage(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                    placeholder="20"
                  />
                </div>
                <div className="pb-2">
                  <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                    Annual Interest Rate %
                    <span className="relative group">
                      <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Annual interest rate for the mortgage loan.
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </span>
                  </label>
                  <input 
                    type="number" 
                    value={annualInterestRate}
                    onChange={e => setAnnualInterestRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                    placeholder="7.5"
                    step="0.1"
                  />
                </div>
                <div className="pb-2">
                  <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                    Loan Term (Years)
                    <span className="relative group">
                      <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Length of the mortgage loan in years.
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </span>
                  </label>
                  <input 
                    type="number" 
                    value={loanTermYears}
                    onChange={e => setLoanTermYears(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                    placeholder="30"
                  />
                </div>
                <div className="pb-2">
                  <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                    Closing Loan Fees
                    <span className="relative group">
                      <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Additional loan fees including origination, points, and other closing costs.
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </span>
                  </label>
                  <input 
                    type="number" 
                    value={closingLoanFees}
                    onChange={e => setClosingLoanFees(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                    placeholder="$0"
                  />
                                  </div>
                <div className="pb-2">
                  <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                    Underwriting/Processing Fees
                    <span className="relative group">
                      <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Fees for loan underwriting and processing
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </span>
                  </label>
                  <input 
                    type="number" 
                    value={underwritingProcessingFees}
                    onChange={e => setUnderwritingProcessingFees(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                    placeholder="$0"
                  />
                </div>
                <div className="pb-2">
                  <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                    Appraisal Fee
                    <span className="relative group">
                      <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Property appraisal fee
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </span>
                  </label>
                  <input 
                    type="number" 
                    value={appraisalFee}
                    onChange={e => setAppraisalFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                    placeholder="$0"
                  />
                </div>
                <div className="pb-2">
                  <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                    Projected Loan Extension Fees
                    <span className="relative group">
                      <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Projected fees for loan extensions if needed
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </span>
                  </label>
                  <input 
                    type="number" 
                    value={projectedLoanExtensionFees}
                    onChange={e => setProjectedLoanExtensionFees(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                    placeholder="$0"
                  />
                </div>
                <div className="pb-2">
                  <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                    Other Monthly Income
                    <span className="relative group">
                      <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Other monthly income for debt-to-income ratio calculation.
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </span>
                  </label>
                  <input 
                    type="number" 
                    value={monthlyIncome}
                    onChange={e => setMonthlyIncome(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                    placeholder="$0"
                  />
                </div>
                <div className="pb-2">
                  <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                    Other Monthly Debt
                    <span className="relative group">
                      <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Other monthly debt payments for debt-to-income ratio calculation.
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </span>
                  </label>
                  <input 
                    type="number" 
                    value={otherMonthlyDebt}
                    onChange={e => setOtherMonthlyDebt(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                    placeholder="$0"
                  />
                </div>
              </div>
              
              {/* Loan Analysis */}
              <div className="p-4 bg-gray-50 rounded-lg mx-4 mb-4">
                <h4 className="text-[#111518] text-base font-bold leading-tight tracking-[-0.015em] mb-3">Financing Analysis</h4>
                <div className="space-y-4">
                  {/* Loan Amount */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="relative group">
                        <svg className="w-4 h-4 text-gray-400 mr-2 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          Total loan amount based on purchase price and down payment percentage
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                      <span className="text-[#111518] text-sm font-medium">Loan Amount</span>
                    </div>
                    <span className="text-[#111518] text-sm font-bold">{loanAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: showDecimals ? 2 : 0, minimumFractionDigits: showDecimals ? 2 : 0 })}</span>
                  </div>

                  {/* Monthly Payment */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="relative group">
                        <svg className="w-4 h-4 text-gray-400 mr-2 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          Monthly mortgage payment including principal and interest
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                      <span className="text-[#111518] text-sm font-medium">Monthly Payment</span>
                    </div>
                    <span className="text-[#111518] text-sm font-bold">{monthlyMortgagePayment.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: showDecimals ? 2 : 0, minimumFractionDigits: showDecimals ? 2 : 0 })}</span>
                  </div>

                  {/* Total Interest Paid */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="relative group">
                        <svg className="w-4 h-4 text-gray-400 mr-2 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          Interest paid over the holding period (Annual Interest Rate × Loan Amount × Months Held ÷ 12)
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                      <span className="text-[#111518] text-sm font-medium">Total Interest Paid</span>
                    </div>
                    <span className="text-red-600 text-sm font-bold">{totalInterestPaid.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: showDecimals ? 2 : 0, minimumFractionDigits: showDecimals ? 2 : 0 })}</span>
                  </div>

                  {/* Total Loan Costs */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="relative group">
                        <svg className="w-4 h-4 text-gray-400 mr-2 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          Total loan costs including interest and fees
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                      <span className="text-[#111518] text-sm font-medium">Total Loan Costs</span>
                    </div>
                    <span className="text-red-600 text-sm font-bold">{totalLoanCosts.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: showDecimals ? 2 : 0, minimumFractionDigits: showDecimals ? 2 : 0 })}</span>
                  </div>
                </div>
              </div>
              
              {/* Cancel Financing Button */}
              <div className="flex justify-end px-4 pb-4">
                <button
                  onClick={() => setShowLoanEvaluation(false)}
                  className="flex items-center justify-center rounded-lg h-10 px-4 bg-gray-500 text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-600 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Cancel Financing</span>
                </button>
              </div>
              </div>
            )}

            {/* Holding Costs */}
            <h3 className="text-[#111518] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Holding Costs</h3>
            {/* Months Held Slider - Only show when financing is NOT active */}
            {!showLoanEvaluation && (
              <div className="px-4 pb-4 col-span-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                  Months Held
                  <span className="relative group">
                    <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      How many months you expect to hold the property before selling. Impacts holding costs and ROI calculations.
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </span>
                </label>
                <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4">
                  <input
                    type="range"
                    min={0.5}
                    max={24}
                    step={0.5}
                    value={monthsHeld}
                    onChange={e => setMonthsHeld(Number(e.target.value))}
                    className="w-full accent-blue-500 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-lg h-2"
                    aria-label="Months Held"
                    style={{ background: 'linear-gradient(90deg, #e0e7ef 0%, #f8fafc 100%)' }}
                  />
                  <span className="text-[#111518] text-sm font-medium w-24 text-center bg-white border border-gray-200 rounded-lg py-1 shadow-sm">{monthsHeld} months</span>
                </div>
              </div>
            )}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                  Property Taxes
                  <span className="relative group">
                    <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Annual property tax assessment
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    placeholder="$0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                    value={getDisplayValue(propertyTaxesAnnual, propertyTaxesMode)}
                    onChange={e => handleInputChange(e, propertyTaxesMode, setPropertyTaxesAnnual)}
                    onBlur={() => handleInputBlur(propertyTaxesAnnual, setPropertyTaxesAnnual, propertyTaxesMode)}
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className={`px-2 py-1 rounded-l border border-gray-200 text-xs font-medium ${propertyTaxesMode === 'monthly' ? 'bg-gray-100 text-gray-800 font-bold' : 'bg-white text-gray-500'}`}
                      onClick={() => {
                        if (propertyTaxesMode !== 'monthly') {
                          setPropertyTaxesMode('monthly');
                        }
                      }}
                    >Monthly</button>
                    <button
                      type="button"
                      className={`px-2 py-1 rounded-r border border-gray-300 text-xs font-bold ${propertyTaxesMode === 'annual' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-500 font-medium'}`}
                      onClick={() => {
                        if (propertyTaxesMode !== 'annual') {
                          setPropertyTaxesMode('annual');
                        }
                      }}
                    >Annual</button>
                  </div>
                </div>
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                  Insurance Costs
                  <span className="relative group">
                    <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Annual property insurance premium
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    placeholder="$0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                    value={getDisplayValue(insuranceCostsAnnual, insuranceCostsMode)}
                    onChange={e => handleInputChange(e, insuranceCostsMode, setInsuranceCostsAnnual)}
                    onBlur={() => handleInputBlur(insuranceCostsAnnual, setInsuranceCostsAnnual, insuranceCostsMode)}
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className={`px-2 py-1 rounded-l border border-gray-200 text-xs font-medium ${insuranceCostsMode === 'monthly' ? 'bg-gray-100 text-gray-800 font-bold' : 'bg-white text-gray-500'}`}
                      onClick={() => {
                        if (insuranceCostsMode !== 'monthly') {
                          setInsuranceCostsMode('monthly');
                        }
                      }}
                    >Monthly</button>
                    <button
                      type="button"
                      className={`px-2 py-1 rounded-r border border-gray-300 text-xs font-bold ${insuranceCostsMode === 'annual' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-500 font-medium'}`}
                      onClick={() => {
                        if (insuranceCostsMode !== 'annual') {
                          setInsuranceCostsMode('annual');
                        }
                      }}
                    >Annual</button>
                  </div>
                </div>
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                  HOA Fees
                  <span className="relative group">
                    <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Monthly homeowners association dues
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    placeholder="$0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                    value={getDisplayValue(hoaFeesAnnual, hoaFeesMode)}
                    onChange={e => handleInputChange(e, hoaFeesMode, setHoaFeesAnnual)}
                    onBlur={() => handleInputBlur(hoaFeesAnnual, setHoaFeesAnnual, hoaFeesMode)}
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className={`px-2 py-1 rounded-l border border-gray-200 text-xs font-medium ${hoaFeesMode === 'monthly' ? 'bg-gray-100 text-gray-800 font-bold' : 'bg-white text-gray-500'}`}
                      onClick={() => {
                        if (hoaFeesMode !== 'monthly') {
                          setHoaFeesMode('monthly');
                        }
                      }}
                    >Monthly</button>
                    <button
                      type="button"
                      className={`px-2 py-1 rounded-r border border-gray-300 text-xs font-bold ${hoaFeesMode === 'annual' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-500 font-medium'}`}
                      onClick={() => {
                        if (hoaFeesMode !== 'annual') {
                          setHoaFeesMode('annual');
                        }
                      }}
                    >Annual</button>
                  </div>
                </div>
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                  Utilities Costs
                  <span className="relative group">
                    <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Monthly utility service expenses
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    placeholder="$0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                    value={getDisplayValue(utilitiesCostsAnnual, utilitiesCostsMode)}
                    onChange={e => handleInputChange(e, utilitiesCostsMode, setUtilitiesCostsAnnual)}
                    onBlur={() => handleInputBlur(utilitiesCostsAnnual, setUtilitiesCostsAnnual, utilitiesCostsMode)}
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className={`px-2 py-1 rounded-l border border-gray-200 text-xs font-medium ${utilitiesCostsMode === 'monthly' ? 'bg-gray-100 text-gray-800 font-bold' : 'bg-white text-gray-500'}`}
                      onClick={() => {
                        if (utilitiesCostsMode !== 'monthly') {
                          setUtilitiesCostsMode('monthly');
                        }
                      }}
                    >Monthly</button>
                    <button
                      type="button"
                      className={`px-2 py-1 rounded-r border border-gray-300 text-xs font-bold ${utilitiesCostsMode === 'annual' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-500 font-medium'}`}
                      onClick={() => {
                        if (utilitiesCostsMode !== 'annual') {
                          setUtilitiesCostsMode('annual');
                        }
                      }}
                    >Annual</button>
                  </div>
                </div>
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                  Accounting and Legal Fees
                  <span className="relative group">
                    <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Professional service fees for legal and accounting
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    placeholder="$0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                    value={getDisplayValue(accountingLegalFeesAnnual, accountingLegalFeesMode)}
                    onChange={e => handleInputChange(e, accountingLegalFeesMode, setAccountingLegalFeesAnnual)}
                    onBlur={() => handleInputBlur(accountingLegalFeesAnnual, setAccountingLegalFeesAnnual, accountingLegalFeesMode)}
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className={`px-2 py-1 rounded-l border border-gray-200 text-xs font-medium ${accountingLegalFeesMode === 'monthly' ? 'bg-gray-100 text-gray-800 font-bold' : 'bg-white text-gray-500'}`}
                      onClick={() => {
                        if (accountingLegalFeesMode !== 'monthly') {
                          setAccountingLegalFeesMode('monthly');
                        }
                      }}
                    >Monthly</button>
                    <button
                      type="button"
                      className={`px-2 py-1 rounded-r border border-gray-300 text-xs font-bold ${accountingLegalFeesMode === 'annual' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-500 font-medium'}`}
                      onClick={() => {
                        if (accountingLegalFeesMode !== 'annual') {
                          setAccountingLegalFeesMode('annual');
                        }
                      }}
                    >Annual</button>
                  </div>
                </div>
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block flex items-center gap-1">
                  Other Holding Fees
                  <span className="relative group">
                    <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Additional ongoing property expenses
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    placeholder="$0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                    value={getDisplayValue(otherHoldingFeesAnnual, otherHoldingFeesMode)}
                    onChange={e => handleInputChange(e, otherHoldingFeesMode, setOtherHoldingFeesAnnual)}
                    onBlur={() => handleInputBlur(otherHoldingFeesAnnual, setOtherHoldingFeesAnnual, otherHoldingFeesMode)}
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className={`px-2 py-1 rounded-l border border-gray-200 text-xs font-medium ${otherHoldingFeesMode === 'monthly' ? 'bg-gray-100 text-gray-800 font-bold' : 'bg-white text-gray-500'}`}
                      onClick={() => {
                        if (otherHoldingFeesMode !== 'monthly') {
                          setOtherHoldingFeesMode('monthly');
                        }
                      }}
                    >Monthly</button>
                    <button
                      type="button"
                      className={`px-2 py-1 rounded-r border border-gray-300 text-xs font-bold ${otherHoldingFeesMode === 'annual' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-500 font-medium'}`}
                      onClick={() => {
                        if (otherHoldingFeesMode !== 'annual') {
                          setOtherHoldingFeesMode('annual');
                        }
                      }}
                    >Annual</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Calculations */}
            <h3 className="text-[#111518] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Calculations</h3>
            <div className="p-4 bg-gray-50 rounded-lg mx-4">
              <div className="space-y-4">
                {/* After Repair Value */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="relative group">
                      <svg className="w-4 h-4 text-gray-400 mr-2 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        The projected market price of the property after repair.
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                    <span className="text-[#111518] text-sm font-medium">After Repair Value</span>
                  </div>
                  <span className="text-[#111518] text-sm font-bold">{afterRepairValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: showDecimals ? 2 : 0, minimumFractionDigits: showDecimals ? 2 : 0 })}</span>
                </div>

                {/* Selling Costs */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="relative group">
                      <svg className="w-4 h-4 text-gray-400 mr-2 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Tax and Agent Commissions
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                    <span className="text-[#111518] text-sm font-medium">Selling Costs</span>
                  </div>
                  <span className="text-red-600 text-sm font-bold">-{sellingCosts.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: showDecimals ? 2 : 0, minimumFractionDigits: showDecimals ? 2 : 0 })}</span>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-300 my-3"></div>

                {/* Sale Proceeds */}
                <div className="flex justify-between items-center">
                  <span className="text-[#111518] text-sm font-medium">Sale Proceeds</span>
                  <span className="text-[#111518] text-sm font-bold">{saleProceeds.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: showDecimals ? 2 : 0, minimumFractionDigits: showDecimals ? 2 : 0 })}</span>
                </div>

                {/* Rehab Costs */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="relative group">
                      <svg className="w-4 h-4 text-gray-400 mr-2 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Renovation and repair costs
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                    <span className="text-[#111518] text-sm font-medium">Rehab Costs</span>
                  </div>
                  <span className="text-red-600 text-sm font-bold">-{rehabCosts.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: showDecimals ? 2 : 0, minimumFractionDigits: showDecimals ? 2 : 0 })}</span>
                </div>

                {/* Holding Costs */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="relative group">
                      <svg className="w-4 h-4 text-gray-400 mr-2 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Property Taxes + Insurance Costs + HOA Fees + Utilities Costs + Accounting and Legal Fees + Other Holding Fees (prorated by months held)
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                    <span className="text-[#111518] text-sm font-medium">Holding Costs</span>
                  </div>
                  <span className="text-red-600 text-sm font-bold">-{holdingCosts.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: showDecimals ? 2 : 0, minimumFractionDigits: showDecimals ? 2 : 0 })}</span>
                </div>

                {/* Financing Costs */}
                {isFinancing && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="relative group">
                        <svg className="w-4 h-4 text-gray-400 mr-2 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          Interest, loan fees, and closing loan fees
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                      <span className="text-[#111518] text-sm font-medium">Financing Costs</span>
                    </div>
                    <span className="text-red-600 text-sm font-bold">-{financingCosts.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: showDecimals ? 2 : 0, minimumFractionDigits: showDecimals ? 2 : 0 })}</span>
                  </div>
                )}

                {/* Invested Capital */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="relative group">
                      <svg className="w-4 h-4 text-gray-400 mr-2 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        {isFinancing 
                          ? `Down Payment (${downPaymentPercentage}% of Purchase Price)`
                          : 'Purchase Price + Closing Costs + Other Purchasing Costs'
                        }
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                    <span className="text-[#111518] text-sm font-medium">Cash Invested</span>
                  </div>
                  <span className="text-red-600 text-sm font-bold">{totalInvestment.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: showDecimals ? 2 : 0, minimumFractionDigits: showDecimals ? 2 : 0 })}</span>
                </div>

                {/* Loan Amount - only show when financing is enabled */}
                {isFinancing && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="relative group">
                        <svg className="w-4 h-4 text-gray-400 mr-2 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          Loan amount to be repaid from sale proceeds
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                      <span className="text-[#111518] text-sm font-medium">Loan Amount</span>
                    </div>
                    <span className="text-red-600 text-sm font-bold">-{loanAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: showDecimals ? 2 : 0, minimumFractionDigits: showDecimals ? 2 : 0 })}</span>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-gray-300 my-3"></div>

                {/* Total Profit */}
                <div className="flex justify-between items-center">
                  <span className="text-[#111518] text-sm font-medium">Total Profit</span>
                  <span className="text-green-600 text-sm font-bold">{totalProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: showDecimals ? 2 : 0, minimumFractionDigits: showDecimals ? 2 : 0 })}</span>
                </div>

                {/* Tax Rate */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="relative group">
                      <svg className="w-4 h-4 text-gray-400 mr-2 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Capital Gains Tax Rate
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                    <span className="text-[#111518] text-sm font-medium">Capital Gains Tax Rate</span>
                  </div>
                  <div className="flex items-center w-24 justify-end">
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="^\d*\.?\d*$"
                      min={0}
                      max={100}
                      value={taxRate * 100}
                      onChange={e => {
                        let val = e.target.value.replace(/[^0-9.]/g, '');
                        let num = Number(val);
                        if (isNaN(num)) num = 0;
                        if (num < 0) num = 0;
                        if (num > 100) num = 100;
                        setTaxRate(num / 100);
                      }}
                      placeholder="0"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-right text-[#111518] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      style={{ MozAppearance: 'textfield' }}
                    />
                    <span className="ml-1 text-[#111518] text-sm font-medium select-none">%</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-300 my-3"></div>

                {/* Post-Tax Profit */}
                <div className="flex justify-between items-center">
                  <span className="text-[#111518] text-sm font-medium">Post-Tax Profit</span>
                  <span className="text-green-600 text-sm font-bold">{postTaxProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: showDecimals ? 2 : 0, minimumFractionDigits: showDecimals ? 2 : 0 })}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-stretch">
              <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-start">
                {(property?.seller_email || property?.seller_phone) && (
                  <button 
                    onClick={handleContactSeller}
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#0b80ee] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#0a6fd8] transition-colors"
                  >
                    <span className="truncate">Contact Seller</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metrics */}
            <h3 className="text-[#111518] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Metrics</h3>
            <div className="p-4 bg-gray-50 rounded-lg mx-4">
              <div className="space-y-4">
                {/* 70% Rule */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {seventyPercentRule.passes ? (
                        <div className="relative group">
                          <svg className="w-5 h-5 text-green-500 mr-2 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Calculation: ({afterRepairValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} × 0.70) - {rehabCosts.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} = {seventyPercentRule.maxPurchasePrice.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <svg className="w-5 h-5 text-red-500 mr-2 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Calculation: ({afterRepairValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} × 0.70) - {rehabCosts.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} = {seventyPercentRule.maxPurchasePrice.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      )}
                      <span className="text-[#111518] text-sm font-medium">70% Rule</span>
                                              <div className="relative group ml-2">
                          <svg className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            (70 × ARV) - Repair Costs
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#111518] text-sm font-bold">
                      {afterRepairValue > 0 ? ((purchasePrice / afterRepairValue) * 100).toFixed(1) : '0.0'}%
                    </div>
                    <div className={`text-xs ${seventyPercentRule.passes ? 'text-green-600' : 'text-red-600'}`}>
                      {seventyPercentRule.passes ? 'PASSES' : `FAILS (${afterRepairValue > 0 ? ((purchasePrice / afterRepairValue) * 100 - 70).toFixed(1) : '0.0'}%)`}
                    </div>
                  </div>
                </div>

                {/* Loan-to-Value Ratio */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {loanToValueRatio <= 0.8 ? (
                        <div className="relative group">
                          <svg className="w-5 h-5 text-green-500 mr-2 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Calculation: {loanAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} ÷ {purchasePrice.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} = {(loanToValueRatio * 100).toFixed(1)}%
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <svg className="w-5 h-5 text-red-500 mr-2 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Calculation: {loanAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} ÷ {purchasePrice.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} = {(loanToValueRatio * 100).toFixed(1)}%
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      )}
                      <span className="text-[#111518] text-sm font-medium">Loan-to-Value Ratio</span>
                      <div className="relative group ml-2">
                        <svg className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          Loan Amount ÷ Purchase Price
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#111518] text-sm font-bold">
                      {(loanToValueRatio * 100).toFixed(1)}%
                    </div>
                    <div className={`text-xs ${loanToValueRatio <= 0.8 ? 'text-green-600' : 'text-red-600'}`}>
                      {loanToValueRatio <= 0.8 ? 'GOOD' : 'HIGH'}
                    </div>
                  </div>
                </div>

                {/* Loan-to-Cost Ratio */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {loanToCostRatio <= 0.75 ? (
                        <div className="relative group">
                          <svg className="w-5 h-5 text-green-500 mr-2 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Calculation: {loanAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} ÷ ({purchasePrice.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} + {rehabCosts.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}) = {(loanToCostRatio * 100).toFixed(1)}%
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <svg className="w-5 h-5 text-red-500 mr-2 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Calculation: {loanAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} ÷ ({purchasePrice.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} + {rehabCosts.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}) = {(loanToCostRatio * 100).toFixed(1)}%
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      )}
                      <span className="text-[#111518] text-sm font-medium">Loan-to-Cost Ratio</span>
                      <div className="relative group ml-2">
                        <svg className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          Loan Amount ÷ (Purchase Price + Rehab Costs)
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#111518] text-sm font-bold">
                      {(loanToCostRatio * 100).toFixed(1)}%
                    </div>
                    <div className={`text-xs ${loanToCostRatio <= 0.75 ? 'text-green-600' : 'text-red-600'}`}>
                      {loanToCostRatio <= 0.75 ? 'GOOD' : 'HIGH'}
                    </div>
                  </div>
                </div>

                {/* Return on Equity */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {returnOnEquity >= 0.15 ? (
                        <div className="relative group">
                          <svg className="w-5 h-5 text-green-500 mr-2 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Calculation: {totalProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} ÷ {(downPayment + rehabCosts + closingCosts).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} = {(returnOnEquity * 100).toFixed(1)}%
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <svg className="w-5 h-5 text-red-500 mr-2 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Calculation: {totalProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} ÷ {(downPayment + rehabCosts + closingCosts).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} = {(returnOnEquity * 100).toFixed(1)}%
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      )}
                      <span className="text-[#111518] text-sm font-medium">Return on Equity</span>
                      <div className="relative group ml-2">
                        <svg className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          Total Profit ÷ Cash Invested
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#111518] text-sm font-bold">
                      {(returnOnEquity * 100).toFixed(1)}%
                    </div>
                    <div className={`text-xs ${returnOnEquity >= 0.15 ? 'text-green-600' : 'text-red-600'}`}>
                      {returnOnEquity >= 0.15 ? 'GOOD' : 'LOW'}
                    </div>
                  </div>
                </div>

                {/* Break-Even Analysis */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {breakEvenAnalysis.breakEvenARV < afterRepairValue ? (
                        <div className="relative group">
                          <svg className="w-5 h-5 text-green-500 mr-2 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Break-even ARV: {breakEvenAnalysis.breakEvenARV.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                            <br />
                            Rehab Costs Margin: {breakEvenAnalysis.rehabCostsMargin.toFixed(1)}%
                            <br />
                            Holding Costs Margin: {breakEvenAnalysis.holdingCostsMargin.toFixed(1)}%
                            {isFinancing && <><br />Financing Costs Margin: {breakEvenAnalysis.financingCostsMargin.toFixed(1)}%</>}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <svg className="w-5 h-5 text-red-500 mr-2 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Break-even ARV: {breakEvenAnalysis.breakEvenARV.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                            <br />
                            Rehab Costs Margin: {breakEvenAnalysis.rehabCostsMargin.toFixed(1)}%
                            <br />
                            Holding Costs Margin: {breakEvenAnalysis.holdingCostsMargin.toFixed(1)}%
                            {isFinancing && <><br />Financing Costs Margin: {breakEvenAnalysis.financingCostsMargin.toFixed(1)}%</>}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      )}
                      <span className="text-[#111518] text-sm font-medium">Break-Even Analysis</span>
                      <div className="relative group ml-2">
                        <svg className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          ARV where profit = 0 and cost variation margins
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#111518] text-sm font-bold">
                      {breakEvenAnalysis.breakEvenARV.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                    </div>
                    <div className={`text-xs ${breakEvenAnalysis.breakEvenARV < afterRepairValue ? 'text-green-600' : 'text-red-600'}`}>
                      {breakEvenAnalysis.breakEvenARV < afterRepairValue ? 'PROFITABLE' : 'AT RISK'}
                    </div>
                  </div>
                </div>

                {/* Debt-to-Income Ratio */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {monthlyIncome === 0 || (otherMonthlyDebt + monthlyMortgagePayment) === 0 ? (
                        <div className="relative group">
                          <svg className="w-5 h-5 text-gray-400 mr-2 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Not applicable when monthly income or total debt is $0
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      ) : debtToIncomeRatio <= 0.43 ? (
                        <div className="relative group">
                          <svg className="w-5 h-5 text-green-500 mr-2 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Calculation: ({monthlyMortgagePayment.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} + {otherMonthlyDebt.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} ÷ {monthlyIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} = {(debtToIncomeRatio * 100).toFixed(1)}%
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      ) : debtToIncomeRatio <= 0.5 ? (
                        <div className="relative group">
                          <svg className="w-5 h-5 text-yellow-500 mr-2 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Calculation: ({monthlyMortgagePayment.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} + {otherMonthlyDebt.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} ÷ {monthlyIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} = {(debtToIncomeRatio * 100).toFixed(1)}%
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <svg className="w-5 h-5 text-red-500 mr-2 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Calculation: ({monthlyMortgagePayment.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} + {otherMonthlyDebt.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} ÷ {monthlyIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} = {(debtToIncomeRatio * 100).toFixed(1)}%
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      )}
                      <span className="text-[#111518] text-sm font-medium">Debt-to-Income Ratio</span>
                      <div className="relative group ml-2">
                        <svg className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          (Mortgage + Other Debt) ÷ Monthly Income
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#111518] text-sm font-bold">
                      {monthlyIncome === 0 || (otherMonthlyDebt + monthlyMortgagePayment) === 0 ? 'Not Applicable' : `${(debtToIncomeRatio * 100).toFixed(1)}%`}
                    </div>
                    <div className={`text-xs ${monthlyIncome === 0 || (otherMonthlyDebt + monthlyMortgagePayment) === 0 ? 'text-gray-500' : debtToIncomeRatio <= 0.43 ? 'text-green-600' : debtToIncomeRatio <= 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {monthlyIncome === 0 || (otherMonthlyDebt + monthlyMortgagePayment) === 0 ? 'N/A' : debtToIncomeRatio <= 0.43 ? 'GOOD' : debtToIncomeRatio <= 0.5 ? 'ACCEPTABLE' : 'HIGH'}
                    </div>
                  </div>
                </div>
              </div>
            </div>



            {/* Disclosures */}
            <h3 className="text-[#111518] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Disclosures</h3>
            <p className="text-[#111518] text-base font-normal leading-normal pb-3 pt-1 px-4">
              All information provided is deemed reliable but not guaranteed. Buyers are advised to conduct their own due diligence. This property is being sold as-is, where-is,
              with all faults. The seller makes no representations or warranties, express or implied, regarding the condition of the property. This is not an offer to sell
              property. Offers are subject to seller approval. Contact a real estate attorney for legal advice.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (property?.seller_email || property?.seller_phone) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-[#111518]">Contact Seller</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Seller Contact Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#111518] mb-3">Seller Information</h3>
                <div className="space-y-2">
                  {property?.seller_email && (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[#111518]">{property.seller_email}</span>
                    </div>
                  )}
                  {property?.seller_phone && (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-[#111518]">{property.seller_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Form */}
              <form onSubmit={handleSubmitContact} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111518] mb-2">
                    Your Contact Information
                  </label>
                  <input
                    type="text"
                    value={userContact}
                    onChange={(e) => setUserContact(e.target.value)}
                    placeholder="your@email.com or (555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111518] mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell the seller about your interest in this property..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-[#111518] rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#0b80ee] text-white rounded-lg hover:bg-[#0a6fd8] transition-colors"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Changes Button */}
      {(hasChanges || isSaving) && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-lg font-semibold transition-all duration-200 ${
              isSaving
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : saveSuccess
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl'
            }`}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : saveSuccess ? (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Saved!</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Success Checkmark Pop Animation */}
      {saveSuccess && !hasChanges && !isSaving && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
          <span
            className="inline-flex items-center justify-center bg-green-500 text-white rounded-full shadow-lg"
            style={{ width: 64, height: 64, animation: 'pop-checkmark 0.9s cubic-bezier(0.22, 1, 0.36, 1)' }}
            aria-live="polite"
            aria-label="Save successful"
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="11" stroke="white" strokeWidth="2.5" fill="none" />
              <path d="M7 13l3 3 7-7" stroke="white" strokeWidth="2.5" fill="none" />
            </svg>
          </span>
          <style>{`
            @keyframes pop-checkmark {
              0% { opacity: 0; transform: scale(0.5); }
              40% { opacity: 1; transform: scale(1.15); }
              60% { opacity: 1; transform: scale(0.95); }
              80% { opacity: 1; transform: scale(1.05); }
              100% { opacity: 0; transform: scale(0.8); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
