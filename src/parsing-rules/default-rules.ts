import { Provider, TransactionCategory, TransactionType } from '@prisma/client';

/**
 * Starting set of SMS parsing rules, loaded by `prisma/seed.ts`.
 *
 * Patterns use named groups so the app can read fields by name:
 *   amount, fee, balance   money values like "5,000" (strip commas before parsing)
 *   counterparty, phone    who the money went to / came from
 *   txId, reference        transaction / bill references
 *   date, time             when the transaction happened (if in the SMS)
 *   meter, token, units    electricity
 *   account                water bill account
 *   agentId                cash-out agent
 * The app should compile patterns case-insensitively and try them in
 * ascending `priority` order, using the first match.
 *
 * Optional fields are written as `(?:.*?Label (?<x>...))?` so they are captured
 * when present and skipped when absent. Samples are illustrative; replace them
 * with real SMS text when you have it.
 */
export interface DefaultRule {
  name: string;
  provider: Provider;
  transactionType: TransactionType;
  category: TransactionCategory;
  priority: number;
  description: string;
  pattern: string;
  sample: string;
}

const AMOUNT = String.raw`RWF (?<amount>[\d,]+)`;
const FEE = String.raw`(?:.*?Fee(?: charged)?: RWF (?<fee>[\d,]+))?`;
const BALANCE = String.raw`.*?[Bb]alance(?: is|:) RWF (?<balance>[\d,]+)`;

export const DEFAULT_PARSING_RULES: DefaultRule[] = [
  // ---------------------------------------------------------------- MTN
  {
    name: 'MTN_BILL_ELECTRICITY',
    provider: Provider.MTN,
    transactionType: TransactionType.expense,
    category: TransactionCategory.electricity,
    priority: 10,
    description: 'Cash Power (REG/EUCL) prepaid electricity token',
    pattern:
      String.raw`^(?:TxId: (?<txId>\d+)\. )?Your payment of ${AMOUNT} to (?<counterparty>REG-EUCL|EUCL|REG|RWANDENERGIE)\b` +
      String.raw`(?:.*?meter (?<meter>\d+))?(?:.*?[Tt]oken:? (?<token>\d{4}(?:-\d{4})+))?(?:.*?Units: (?<units>[\d.]+) kWh)?` +
      FEE +
      BALANCE,
    sample:
      'TxId: 9811223344. Your payment of RWF 10,000 to REG-EUCL for Cash Power meter 01423344556 was successful. Token: 4321-8899-0122-3456-7890. Units: 45.2 kWh. Fee: RWF 50. Balance: RWF 12,400.',
  },
  {
    name: 'MTN_BILL_WATER',
    provider: Provider.MTN,
    transactionType: TransactionType.expense,
    category: TransactionCategory.water,
    priority: 10,
    description: 'WASAC water bill',
    pattern:
      String.raw`^(?:TxId: (?<txId>\d+)\. )?You have paid ${AMOUNT} to (?<counterparty>WASAC)\b` +
      String.raw`(?:.*?(?:Account|Meter)[^:]*: (?<account>[\w-]+))?` +
      FEE +
      BALANCE,
    sample:
      'TxId: 9811223345. You have paid RWF 7,450 to WASAC for Account/Meter No: W-998877. Invoice month: 08/2026. Fee: RWF 0. Your new MoMo balance is RWF 4,950.',
  },
  {
    name: 'MTN_BILL_IREMBO',
    provider: Provider.MTN,
    transactionType: TransactionType.expense,
    category: TransactionCategory.government,
    priority: 10,
    description: 'Irembo government services',
    pattern:
      String.raw`^(?:TxId: (?<txId>\d+)\. )?Your payment of ${AMOUNT} to (?<counterparty>IREMBO)\b` +
      String.raw`(?:.*?Billing ID (?<reference>\d+))?` +
      FEE +
      BALANCE,
    sample:
      'TxId: 9811223399. Your payment of RWF 25,000 to IREMBO for Billing ID 260929112233 was successful. Fee: RWF 100. Balance: RWF 45,000.',
  },
  {
    name: 'MTN_RECEIVED',
    provider: Provider.MTN,
    transactionType: TransactionType.income,
    category: TransactionCategory.transfer,
    priority: 50,
    description: 'Money received from another person',
    pattern:
      String.raw`^(?:TxId: (?<txId>\d+)\. )?You have received ${AMOUNT} from (?<counterparty>.+?) \((?<phone>\d+)\)` +
      String.raw`(?: on (?<date>\d{2}/\d{2}/\d{4})(?: at (?<time>[\d:]+))?)?` +
      BALANCE +
      FEE,
    sample:
      'TxId: 182839201. You have received RWF 5,000 from JOHN DOE (0781234567) on 29/09/2026 at 16:10:05. Your new balance is RWF 15,250. Fee charged: RWF 0.',
  },
  {
    name: 'MTN_SENT',
    provider: Provider.MTN,
    transactionType: TransactionType.expense,
    category: TransactionCategory.transfer,
    priority: 50,
    description: 'Money sent to another person',
    pattern:
      String.raw`^(?:TxId: (?<txId>\d+)\. )?You have successfully transferred ${AMOUNT} to (?<counterparty>.+?) \((?<phone>\d+)\)` +
      BALANCE +
      FEE,
    sample:
      'TxId: 182839202. You have successfully transferred RWF 2,000 to JANE SMITH (0798765432). New balance: RWF 13,050. Fee: RWF 100.',
  },
  {
    name: 'MTN_PAYMENT',
    provider: Provider.MTN,
    transactionType: TransactionType.expense,
    category: TransactionCategory.merchant,
    priority: 100,
    description: 'Any other "Your payment of ... was successful" (fallback)',
    pattern:
      String.raw`^(?:TxId: (?<txId>\d+)\. )?Your payment of ${AMOUNT} to (?<counterparty>.+?)(?: for (?<reference>.+?))? was successful\.` +
      FEE +
      BALANCE,
    sample:
      'Your payment of RWF 5,000 to RWANDENERGIE for token 1234-5678-8910-1112 was successful. Fee: RWF 20. Balance: RWF 8,030.',
  },

  // ------------------------------------------------------------- AIRTEL
  {
    name: 'AIRTEL_BILL_ELECTRICITY',
    provider: Provider.AIRTEL,
    transactionType: TransactionType.expense,
    category: TransactionCategory.electricity,
    priority: 10,
    description: 'Cash Power (REG/EUCL) prepaid electricity token',
    pattern:
      String.raw`^(?:Confirmed\. )?(?:Ref: (?<txId>\w+)\. )?${AMOUNT} paid to (?<counterparty>REG-EUCL|EUCL|REG)\b` +
      String.raw`(?:.*?Meter: (?<meter>\d+))?(?:.*?Token: (?<token>\d{4}(?:-\d{4})+))?(?:.*?Units: (?<units>[\d.]+) kWh)?` +
      FEE +
      BALANCE,
    sample:
      'Confirmed. Ref: TXN5544332. RWF 5,000 paid to EUCL. Meter: 01423344556. Token: 1122-3344-5566-7788-9900. Volts/Units: 21.3 kWh. Balance: RWF 3,100.',
  },
  {
    name: 'AIRTEL_BILL_WATER',
    provider: Provider.AIRTEL,
    transactionType: TransactionType.expense,
    category: TransactionCategory.water,
    priority: 10,
    description: 'WASAC water bill',
    pattern:
      String.raw`^(?:Confirmed\. )?${AMOUNT} sent to (?<counterparty>WASAC)\b` +
      String.raw`(?:.*?account (?<account>[\w-]+))?(?:.*?Trans ID: (?<txId>\w+))?` +
      FEE +
      BALANCE,
    sample:
      'Confirmed. RWF 12,000 sent to WASAC for bill account 44556677. Trans ID: REF991122. Fee: RWF 0. Airtel Money Balance: RWF 15,300.',
  },
  {
    name: 'AIRTEL_BILL_RRA',
    provider: Provider.AIRTEL,
    transactionType: TransactionType.expense,
    category: TransactionCategory.tax,
    priority: 10,
    description: 'Rwanda Revenue Authority tax payment',
    pattern:
      String.raw`^(?:Confirmed\. )?You have paid ${AMOUNT} to (?<counterparty>RWANDA REVENUE AUTHORITY(?: \(RRA\))?|RRA\b)` +
      String.raw`(?:.*?Reference No: (?<reference>\d+))?(?:.*?\bID: (?<txId>\w+))?` +
      FEE +
      BALANCE,
    sample:
      'Confirmed. You have paid RWF 150,000 to RWANDA REVENUE AUTHORITY (RRA) for RRA Reference No: 100299388. ID: TXN445511. Balance: RWF 8,200.',
  },
  {
    name: 'AIRTEL_RECEIVED',
    provider: Provider.AIRTEL,
    transactionType: TransactionType.income,
    category: TransactionCategory.transfer,
    priority: 50,
    description: 'Money received from another person',
    pattern:
      String.raw`^(?:Confirmed\. )?You have received ${AMOUNT} from (?<counterparty>.+?) \((?<phone>\d+)\)` +
      String.raw`(?:.*?Date: (?<date>\d{2}/\d{2}/\d{4})(?: (?<time>[\d:]+))?)?` +
      BALANCE +
      String.raw`(?:.*?Reference: (?<txId>\w+))?`,
    sample:
      'Confirmed. You have received RWF 10,000 from ALICE KAY (0731112223). Date: 29/09/2026 16:12. Balance: RWF 24,500. Reference: TXN998877.',
  },
  {
    name: 'AIRTEL_SENT',
    provider: Provider.AIRTEL,
    transactionType: TransactionType.expense,
    category: TransactionCategory.transfer,
    priority: 50,
    description: 'Money sent to another person',
    pattern:
      String.raw`^(?:Confirmed\. )?You have successfully sent ${AMOUNT} to (?<counterparty>.+?) \((?<phone>\d+)\)` +
      FEE +
      BALANCE,
    sample:
      'You have successfully sent RWF 3,000 to BOBBY NKusi (0723334445). Fee: RWF 50. Total deduction: RWF 3,050. Balance: RWF 21,450.',
  },
  {
    name: 'AIRTEL_CASH_OUT',
    provider: Provider.AIRTEL,
    transactionType: TransactionType.expense,
    category: TransactionCategory.withdrawal,
    priority: 50,
    description: 'Cash withdrawal at an agent',
    pattern:
      String.raw`^(?:Confirmed\. )?Cash out ${AMOUNT} at Agent (?<agentId>\d+)(?: \((?<counterparty>[^)]+)\))?` +
      FEE +
      BALANCE,
    sample:
      'Cash out RWF 5,000 at Agent 44556 (JOHN AGENT). Fee: RWF 150. Balance: RWF 16,300.',
  },
];
