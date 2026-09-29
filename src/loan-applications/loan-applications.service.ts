import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LoanApplicationStatus, ReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';
import { UpdateLoanStatusDto } from './dto/update-status.dto';

@Injectable()
export class LoanApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async apply(userId: string, dto: CreateLoanApplicationDto) {
    const lender = await this.prisma.lender.findUnique({
      where: { id: dto.lenderId },
    });
    if (!lender || !lender.isActive) {
      throw new NotFoundException('Lender not found');
    }

    const report = await this.prisma.report.findUnique({
      where: { id: dto.reportId },
    });
    if (!report || report.userId !== userId) {
      throw new NotFoundException('Report not found');
    }
    if (report.status !== ReportStatus.active) {
      throw new BadRequestException('That report is not active');
    }

    // Eligibility checks against the lender's rules.
    if (report.veloScore < lender.minScore) {
      throw new BadRequestException(
        `Your score ${report.veloScore} is below this lender's minimum of ${lender.minScore}`,
      );
    }
    if (lender.minAmount !== null && dto.amount < lender.minAmount) {
      throw new BadRequestException(
        `Minimum amount for this lender is ${lender.minAmount}`,
      );
    }
    if (lender.maxAmount !== null && dto.amount > lender.maxAmount) {
      throw new BadRequestException(
        `Maximum amount for this lender is ${lender.maxAmount}`,
      );
    }

    return this.prisma.loanApplication.create({
      data: {
        userId,
        lenderId: dto.lenderId,
        reportId: dto.reportId,
        amount: dto.amount,
        purpose: dto.purpose,
        scoreAtApply: report.veloScore,
      },
      include: { lender: true },
    });
  }

  findMine(userId: string) {
    return this.prisma.loanApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { lender: true },
    });
  }

  async findOneOwned(userId: string, id: string) {
    const app = await this.prisma.loanApplication.findUnique({
      where: { id },
      include: { lender: true },
    });
    if (!app || app.userId !== userId) {
      throw new NotFoundException('Application not found');
    }
    return app;
  }

  async withdraw(userId: string, id: string) {
    const app = await this.findOneOwned(userId, id);
    const finished: LoanApplicationStatus[] = [
      LoanApplicationStatus.approved,
      LoanApplicationStatus.rejected,
      LoanApplicationStatus.withdrawn,
    ];
    if (finished.includes(app.status)) {
      throw new BadRequestException(
        `Cannot withdraw an application that is ${app.status}`,
      );
    }
    return this.prisma.loanApplication.update({
      where: { id },
      data: { status: LoanApplicationStatus.withdrawn },
    });
  }

  // ---- admin / lender back-office ----

  findAll(status?: LoanApplicationStatus) {
    return this.prisma.loanApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { lender: true },
    });
  }

  async updateStatus(id: string, dto: UpdateLoanStatusDto) {
    const app = await this.prisma.loanApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');
    if (app.status === LoanApplicationStatus.withdrawn) {
      throw new ForbiddenException('This application was withdrawn');
    }
    return this.prisma.loanApplication.update({
      where: { id },
      data: { status: dto.status, lenderNote: dto.lenderNote },
    });
  }
}
