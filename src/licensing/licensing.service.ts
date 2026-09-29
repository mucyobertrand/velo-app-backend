import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LicenseStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { randomCode, sha256 } from '../common/crypto.util';
import { IssueLicenseDto } from './dto/issue-license.dto';

/** Normalises user input so "velo-ab12 cd34" matches "VELO-AB12-CD34". */
function normaliseCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

@Injectable()
export class LicensingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
  ) {}

  /** Admin: create a code after confirming a MoMo payment manually. */
  async issue(dto: IssueLicenseDto) {
    const code = `VELO-${randomCode(4)}-${randomCode(4)}`;
    const license = await this.prisma.licenseCode.create({
      data: {
        codeHash: sha256(normaliseCode(code)),
        momoReference: dto.momoReference,
        amountPaid: dto.amountPaid,
      },
    });

    if (dto.sendToPhone) {
      await this.sms.send(
        dto.sendToPhone,
        `Thank you for your payment. Your Velo premium code is ${code}`,
      );
    }

    // The plain code is only ever returned here; only its hash is stored.
    return { id: license.id, code, issuedAt: license.issuedAt };
  }

  list() {
    return this.prisma.licenseCode.findMany({
      orderBy: { issuedAt: 'desc' },
      omit: { codeHash: true },
    });
  }

  async revoke(id: string) {
    const license = await this.prisma.licenseCode.findUnique({ where: { id } });
    if (!license) throw new NotFoundException('License code not found');
    return this.prisma.licenseCode.update({
      where: { id },
      data: { status: LicenseStatus.revoked },
      omit: { codeHash: true },
    });
  }

  async redeem(userId: string, code: string) {
    const license = await this.prisma.licenseCode.findUnique({
      where: { codeHash: sha256(normaliseCode(code)) },
    });
    if (!license || license.status !== LicenseStatus.issued) {
      throw new BadRequestException('Invalid or already used code');
    }

    // Conditional update guards against two redemptions racing each other.
    const [{ count }] = await this.prisma.$transaction([
      this.prisma.licenseCode.updateMany({
        where: { id: license.id, status: LicenseStatus.issued },
        data: {
          status: LicenseStatus.redeemed,
          userId,
          redeemedAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { hasPremium: true },
      }),
    ]);
    if (count === 0) {
      throw new BadRequestException('Invalid or already used code');
    }

    return { message: 'Premium unlocked', hasPremium: true };
  }
}
