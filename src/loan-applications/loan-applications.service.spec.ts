import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoanApplicationsService } from './loan-applications.service';

// Minimal fake PrismaService driven per-test.
function makePrisma(over: {
  lender?: unknown;
  report?: unknown;
}): PrismaService {
  const prisma = {
    lender: { findUnique: jest.fn().mockResolvedValue(over.lender ?? null) },
    report: { findUnique: jest.fn().mockResolvedValue(over.report ?? null) },
    loanApplication: {
      create: jest.fn().mockImplementation(({ data }: { data: object }) => ({
        id: 'app1',
        ...data,
      })),
    },
  };
  return prisma as unknown as PrismaService;
}

const USER = 'user1';
const activeLender = {
  id: 'lender1',
  isActive: true,
  minScore: 650,
  minAmount: 20000,
  maxAmount: 500000,
};
const goodReport = {
  id: 'report1',
  userId: USER,
  status: ReportStatus.active,
  veloScore: 720,
};
const dto = {
  lenderId: 'lender1',
  reportId: 'report1',
  amount: 200000,
  purpose: 'stock',
};

describe('LoanApplicationsService.apply', () => {
  it('creates an application when eligible', async () => {
    const svc = new LoanApplicationsService(
      makePrisma({ lender: activeLender, report: goodReport }),
    );
    const app = await svc.apply(USER, dto);
    expect(app.scoreAtApply).toBe(720);
    expect(app.lenderId).toBe('lender1');
  });

  it('rejects when the score is below the lender minimum', async () => {
    const svc = new LoanApplicationsService(
      makePrisma({
        lender: activeLender,
        report: { ...goodReport, veloScore: 400 },
      }),
    );
    await expect(svc.apply(USER, dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects an amount above the lender maximum', async () => {
    const svc = new LoanApplicationsService(
      makePrisma({ lender: activeLender, report: goodReport }),
    );
    await expect(
      svc.apply(USER, { ...dto, amount: 999999 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects another user's report", async () => {
    const svc = new LoanApplicationsService(
      makePrisma({
        lender: activeLender,
        report: { ...goodReport, userId: 'someone-else' },
      }),
    );
    await expect(svc.apply(USER, dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a revoked report', async () => {
    const svc = new LoanApplicationsService(
      makePrisma({
        lender: activeLender,
        report: { ...goodReport, status: ReportStatus.revoked },
      }),
    );
    await expect(svc.apply(USER, dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects an inactive lender', async () => {
    const svc = new LoanApplicationsService(
      makePrisma({
        lender: { ...activeLender, isActive: false },
        report: goodReport,
      }),
    );
    await expect(svc.apply(USER, dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
