import { Provider } from '@prisma/client';
import { DEFAULT_PARSING_RULES } from './default-rules';
import { checkPattern, matchRule } from './rule-matcher';

/** First matching rule by priority, like the app does. */
function parse(provider: Provider, message: string) {
  const rules = DEFAULT_PARSING_RULES.filter((r) => r.provider === provider)
    .slice()
    .sort((a, b) => a.priority - b.priority);
  for (const rule of rules) {
    const fields = matchRule(rule.pattern, message);
    if (fields) return { name: rule.name, fields };
  }
  return null;
}

const CASES: {
  provider: Provider;
  message: string;
  name: string;
  fields: Record<string, string>;
}[] = [
  {
    provider: Provider.MTN,
    message:
      'TxId: 182839201. You have received RWF 5,000 from JOHN DOE (0781234567) on 29/09/2026 at 16:10:05. Your new balance is RWF 15,250. Fee charged: RWF 0.',
    name: 'MTN_RECEIVED',
    fields: {
      txId: '182839201',
      amount: '5,000',
      counterparty: 'JOHN DOE',
      phone: '0781234567',
      date: '29/09/2026',
      time: '16:10:05',
      balance: '15,250',
      fee: '0',
    },
  },
  {
    provider: Provider.MTN,
    message:
      'TxId: 182839202. You have successfully transferred RWF 2,000 to JANE SMITH (0798765432). New balance: RWF 13,050. Fee: RWF 100.',
    name: 'MTN_SENT',
    fields: {
      txId: '182839202',
      amount: '2,000',
      counterparty: 'JANE SMITH',
      phone: '0798765432',
      balance: '13,050',
      fee: '100',
    },
  },
  {
    provider: Provider.MTN,
    message:
      'Your payment of RWF 5,000 to RWANDENERGIE for token 1234-5678-8910-1112 was successful. Fee: RWF 20. Balance: RWF 8,030.',
    name: 'MTN_BILL_ELECTRICITY',
    fields: {
      amount: '5,000',
      counterparty: 'RWANDENERGIE',
      token: '1234-5678-8910-1112',
      fee: '20',
      balance: '8,030',
    },
  },
  {
    provider: Provider.MTN,
    message:
      'TxId: 9811223344. Your payment of RWF 10,000 to REG-EUCL for Cash Power meter 01423344556 was successful. Token: 4321-8899-0122-3456-7890. Units: 45.2 kWh. Fee: RWF 50. Balance: RWF 12,400.',
    name: 'MTN_BILL_ELECTRICITY',
    fields: {
      txId: '9811223344',
      amount: '10,000',
      counterparty: 'REG-EUCL',
      meter: '01423344556',
      token: '4321-8899-0122-3456-7890',
      units: '45.2',
      fee: '50',
      balance: '12,400',
    },
  },
  {
    provider: Provider.MTN,
    message:
      'TxId: 9811223345. You have paid RWF 7,450 to WASAC for Account/Meter No: W-998877. Invoice month: 08/2026. Fee: RWF 0. Your new MoMo balance is RWF 4,950.',
    name: 'MTN_BILL_WATER',
    fields: {
      txId: '9811223345',
      amount: '7,450',
      counterparty: 'WASAC',
      account: 'W-998877',
      fee: '0',
      balance: '4,950',
    },
  },
  {
    provider: Provider.MTN,
    message:
      'TxId: 9811223399. Your payment of RWF 25,000 to IREMBO for Billing ID 260929112233 was successful. Fee: RWF 100. Balance: RWF 45,000.',
    name: 'MTN_BILL_IREMBO',
    fields: {
      txId: '9811223399',
      amount: '25,000',
      counterparty: 'IREMBO',
      reference: '260929112233',
      fee: '100',
      balance: '45,000',
    },
  },
  {
    provider: Provider.MTN,
    message:
      'Your payment of RWF 3,500 to SIMBA SUPERMARKET was successful. Fee: RWF 0. Balance: RWF 9,000.',
    name: 'MTN_PAYMENT',
    fields: {
      amount: '3,500',
      counterparty: 'SIMBA SUPERMARKET',
      fee: '0',
      balance: '9,000',
    },
  },
  {
    provider: Provider.AIRTEL,
    message:
      'Confirmed. You have received RWF 10,000 from ALICE KAY (0731112223). Date: 29/09/2026 16:12. Balance: RWF 24,500. Reference: TXN998877.',
    name: 'AIRTEL_RECEIVED',
    fields: {
      amount: '10,000',
      counterparty: 'ALICE KAY',
      phone: '0731112223',
      date: '29/09/2026',
      time: '16:12',
      balance: '24,500',
      txId: 'TXN998877',
    },
  },
  {
    provider: Provider.AIRTEL,
    message:
      'You have successfully sent RWF 3,000 to BOBBY NKusi (0723334445). Fee: RWF 50. Total deduction: RWF 3,050. Balance: RWF 21,450.',
    name: 'AIRTEL_SENT',
    fields: {
      amount: '3,000',
      counterparty: 'BOBBY NKusi',
      phone: '0723334445',
      fee: '50',
      balance: '21,450',
    },
  },
  {
    provider: Provider.AIRTEL,
    message:
      'Cash out RWF 5,000 at Agent 44556 (JOHN AGENT). Fee: RWF 150. Balance: RWF 16,300.',
    name: 'AIRTEL_CASH_OUT',
    fields: {
      amount: '5,000',
      agentId: '44556',
      counterparty: 'JOHN AGENT',
      fee: '150',
      balance: '16,300',
    },
  },
  {
    provider: Provider.AIRTEL,
    message:
      'Confirmed. Ref: TXN5544332. RWF 5,000 paid to EUCL. Meter: 01423344556. Token: 1122-3344-5566-7788-9900. Volts/Units: 21.3 kWh. Balance: RWF 3,100.',
    name: 'AIRTEL_BILL_ELECTRICITY',
    fields: {
      txId: 'TXN5544332',
      amount: '5,000',
      counterparty: 'EUCL',
      meter: '01423344556',
      token: '1122-3344-5566-7788-9900',
      units: '21.3',
      balance: '3,100',
    },
  },
  {
    provider: Provider.AIRTEL,
    message:
      'Confirmed. RWF 12,000 sent to WASAC for bill account 44556677. Trans ID: REF991122. Fee: RWF 0. Airtel Money Balance: RWF 15,300.',
    name: 'AIRTEL_BILL_WATER',
    fields: {
      amount: '12,000',
      counterparty: 'WASAC',
      account: '44556677',
      txId: 'REF991122',
      fee: '0',
      balance: '15,300',
    },
  },
  {
    provider: Provider.AIRTEL,
    message:
      'Confirmed. You have paid RWF 150,000 to RWANDA REVENUE AUTHORITY (RRA) for RRA Reference No: 100299388. ID: TXN445511. Balance: RWF 8,200.',
    name: 'AIRTEL_BILL_RRA',
    fields: {
      amount: '150,000',
      counterparty: 'RWANDA REVENUE AUTHORITY (RRA)',
      reference: '100299388',
      txId: 'TXN445511',
      balance: '8,200',
    },
  },
];

describe('default parsing rules', () => {
  it.each(DEFAULT_PARSING_RULES.map((r) => [r.name, r] as const))(
    '%s is valid and matches its own sample',
    (_name, rule) => {
      expect(checkPattern(rule.pattern, rule.sample)).toBeNull();
    },
  );

  it('has unique names', () => {
    const names = DEFAULT_PARSING_RULES.map((r) => r.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(CASES.map((c) => [c.name, c] as const))(
    'parses a %s message',
    (_name, c) => {
      expect(parse(c.provider, c.message)).toEqual({
        name: c.name,
        fields: c.fields,
      });
    },
  );

  it('ignores messages that are not transactions', () => {
    expect(parse(Provider.MTN, 'Dial *182# to check your balance.')).toBeNull();
    expect(parse(Provider.AIRTEL, 'Your OTP is 123456')).toBeNull();
  });
});
