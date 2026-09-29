/**
 * Default Velo score formula, loaded by `prisma/seed.ts`.
 *
 * The score runs ON THE DEVICE. For each factor the app computes a value in
 * 0..1 from the user's transactions, multiplies by the factor weight, sums
 * them, and multiplies by maxScore. Weights should add up to 1.
 *
 * Tune these numbers here (or via the API) without shipping a new app build.
 */
export const DEFAULT_SCORING_CONFIG = {
  version: 1,
  maxScore: 1000,
  factors: [
    {
      key: 'income_stability',
      label: 'Income stability',
      weight: 0.3,
      description:
        'How regular monthly income is. Steadier income scores higher.',
    },
    {
      key: 'income_level',
      label: 'Income level',
      weight: 0.2,
      description: 'Average monthly income relative to a reference amount.',
    },
    {
      key: 'savings_ratio',
      label: 'Savings ratio',
      weight: 0.2,
      description: 'Share of income not spent (income minus expenses).',
    },
    {
      key: 'expense_control',
      label: 'Expense control',
      weight: 0.15,
      description: 'Lower expense-to-income ratio scores higher.',
    },
    {
      key: 'activity',
      label: 'Account activity',
      weight: 0.15,
      description: 'Months with recorded transactions in the period.',
    },
  ],
  bands: [
    {
      min: 0,
      max: 399,
      label: 'Building',
      recommendation:
        'Keep recording income and reducing unnecessary spending to grow your score.',
    },
    {
      min: 400,
      max: 649,
      label: 'Fair',
      recommendation:
        'You may qualify for small loans. A few months of steady income will help.',
    },
    {
      min: 650,
      max: 799,
      label: 'Good',
      recommendation: 'You are loan-ready for most SACCOs.',
    },
    {
      min: 800,
      max: 1000,
      label: 'Excellent',
      recommendation: 'You qualify for the best rates and larger amounts.',
    },
  ],
};
