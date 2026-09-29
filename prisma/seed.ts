import { LenderType, PrismaClient } from '@prisma/client';
import { DEFAULT_PARSING_RULES } from '../src/parsing-rules/default-rules';
import { checkPattern } from '../src/parsing-rules/rule-matcher';
import { DEFAULT_SCORING_CONFIG } from '../src/scoring/default-scoring-config';

const prisma = new PrismaClient();

/** Parsing rules (unchanged rows are left as-is, so API edits survive). */
async function seedParsingRules() {
  let created = 0;
  for (const rule of DEFAULT_PARSING_RULES) {
    const error = checkPattern(rule.pattern, rule.sample);
    if (error) throw new Error(`${rule.name}: ${error}`);
    const existing = await prisma.parsingRule.findUnique({
      where: { name: rule.name },
    });
    if (existing) continue;
    await prisma.parsingRule.create({ data: rule });
    created++;
  }
  console.log(
    `Parsing rules: ${created} created, ${DEFAULT_PARSING_RULES.length - created} already existed`,
  );
}

/** Publish the default scoring config as version 1 if none exists yet. */
async function seedScoringConfig() {
  const existing = await prisma.scoringConfig.findUnique({
    where: { version: DEFAULT_SCORING_CONFIG.version },
  });
  if (existing) {
    console.log('Scoring config: already present');
    return;
  }
  await prisma.scoringConfig.create({
    data: {
      version: DEFAULT_SCORING_CONFIG.version,
      maxScore: DEFAULT_SCORING_CONFIG.maxScore,
      factors: DEFAULT_SCORING_CONFIG.factors,
      bands: DEFAULT_SCORING_CONFIG.bands,
      isActive: true,
    },
  });
  console.log('Scoring config: created v1 (active)');
}

/** A couple of example lenders so the loan flow is testable out of the box. */
async function seedLenders() {
  const samples = [
    {
      name: 'Umurenge SACCO (example)',
      type: LenderType.SACCO,
      description:
        'Community SACCO offering small business and personal loans.',
      minScore: 500,
      minAmount: 20000,
      maxAmount: 500000,
      interestRate: 16,
      contactPhone: '+250788000001',
    },
    {
      name: 'Umutanguha Finance (example)',
      type: LenderType.MFI,
      description: 'Microfinance for traders and cooperatives.',
      minScore: 650,
      minAmount: 50000,
      maxAmount: 2000000,
      interestRate: 21,
      contactPhone: '+250788000002',
    },
  ];
  if ((await prisma.lender.count()) > 0) {
    console.log('Lenders: already present');
    return;
  }
  await prisma.lender.createMany({ data: samples });
  console.log(`Lenders: created ${samples.length} examples`);
}

/** A few starter financial tips (English). Translate/add more via the API. */
async function seedTips() {
  const tips = [
    {
      title: 'Save before you spend',
      body: 'Each time money comes in, set aside a small part first. Even RWF 500 adds up.',
      language: 'en',
      category: 'saving',
      priority: 10,
    },
    {
      title: 'Keep some income steady',
      body: 'Lenders like regular income. Try to record money coming in every month.',
      language: 'en',
      category: 'borrowing',
      priority: 20,
    },
    {
      title: 'Borrow what you can repay',
      body: 'Only apply for a loan amount your monthly income can comfortably cover.',
      language: 'en',
      category: 'borrowing',
      priority: 30,
    },
  ];
  if ((await prisma.contentTip.count()) > 0) {
    console.log('Tips: already present');
    return;
  }
  await prisma.contentTip.createMany({ data: tips });
  console.log(`Tips: created ${tips.length}`);
}

async function main() {
  await seedParsingRules();
  await seedScoringConfig();
  await seedLenders();
  await seedTips();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
