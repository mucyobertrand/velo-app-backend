import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Report, ReportStatus, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { randomCode } from '../common/crypto.util';
import { CreateReportDto } from './dto/create-report.dto';
import { PdfService } from './pdf.service';
import { SigningService } from './signing.service';

/**
 * JSON.stringify with sorted object keys. Postgres jsonb does not keep key
 * order, so signing needs a canonical form that survives a round trip.
 */
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.keys(value)
      .sort()
      .map(
        (k) =>
          `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`,
      );
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}

type SignedFields = Pick<
  Report,
  | 'userId'
  | 'periodStart'
  | 'periodEnd'
  | 'summaryJson'
  | 'veloScore'
  | 'verifyCode'
  | 'createdAt'
>;

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly signing: SigningService,
    private readonly pdf: PdfService,
  ) {}

  /** The exact string that gets signed. Any change to these fields breaks it. */
  private message(fields: SignedFields): string {
    return canonicalJson({
      userId: fields.userId,
      periodStart: fields.periodStart.toISOString(),
      periodEnd: fields.periodEnd.toISOString(),
      summary: fields.summaryJson,
      veloScore: fields.veloScore,
      verifyCode: fields.verifyCode,
      createdAt: fields.createdAt.toISOString(),
    });
  }

  async create(user: User, dto: CreateReportDto) {
    if (!user.hasPremium) {
      throw new ForbiddenException('A premium unlock is required for reports');
    }
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    if (periodEnd <= periodStart) {
      throw new BadRequestException('periodEnd must be after periodStart');
    }

    // Retry in the (very unlikely) case of a verify code collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      const fields: SignedFields = {
        userId: user.id,
        periodStart,
        periodEnd,
        summaryJson: dto.summary as Prisma.JsonObject,
        veloScore: dto.veloScore,
        verifyCode: `VLO-${randomCode(6)}`,
        createdAt: new Date(),
      };
      try {
        return await this.prisma.report.create({
          data: {
            ...fields,
            summaryJson: fields.summaryJson as Prisma.InputJsonValue,
            signature: this.signing.sign(this.message(fields)),
          },
        });
      } catch (e) {
        const isCollision =
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002';
        if (!isCollision) throw e;
      }
    }
    throw new Error('Could not generate a unique verify code');
  }

  findMine(userId: string) {
    return this.prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOwned(userId: string, id: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report || report.userId !== userId) {
      throw new NotFoundException('Report not found');
    }
    return report;
  }

  /** Renders the watermarked, signed PDF for one of the user's reports. */
  async renderPdf(userId: string, id: string): Promise<Buffer> {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!report || report.userId !== userId) {
      throw new NotFoundException('Report not found');
    }
    return this.pdf.render(report, report.user);
  }

  async revoke(userId: string, id: string) {
    await this.findOneOwned(userId, id);
    return this.prisma.report.update({
      where: { id },
      data: { status: ReportStatus.revoked },
    });
  }

  /** The public key anyone can use to verify a report signature themselves. */
  publicKey() {
    return {
      algorithm: 'Ed25519',
      publicKeyPem: this.signing.publicKeyPem,
    };
  }

  /** Public check for lenders. Returns only minimal, non-sensitive info. */
  async verify(verifyCode: string) {
    const report = await this.prisma.report.findUnique({
      where: { verifyCode: verifyCode.toUpperCase() },
      include: { user: true },
    });
    if (!report) throw new NotFoundException('No report with this code');

    const signatureValid = this.signing.verify(
      this.message(report),
      report.signature,
    );
    const expired = !!report.expiresAt && report.expiresAt < new Date();
    const valid =
      signatureValid && !expired && report.status === ReportStatus.active;

    return {
      verifyCode: report.verifyCode,
      valid,
      status: expired ? 'expired' : report.status,
      signatureValid,
      phoneLast4: report.user.phoneNumber.slice(-4),
      veloScore: report.veloScore,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      issuedAt: report.createdAt,
    };
  }
}
