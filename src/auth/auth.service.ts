import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { randomDigits } from '../common/crypto.util';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly ttlMinutes: number;
  private readonly maxAttempts: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly sms: SmsService,
    config: ConfigService,
  ) {
    this.ttlMinutes = Number(config.get('OTP_TTL_MINUTES') ?? 5);
    this.maxAttempts = Number(config.get('OTP_MAX_ATTEMPTS') ?? 5);
  }

  async requestOtp(phoneNumber: string) {
    const code = randomDigits(6);

    // Only one live code per phone: requesting a new one replaces the old one.
    await this.prisma.$transaction([
      this.prisma.otpCode.deleteMany({ where: { phoneNumber } }),
      this.prisma.otpCode.create({
        data: {
          phoneNumber,
          code,
          expiresAt: new Date(Date.now() + this.ttlMinutes * 60_000),
        },
      }),
    ]);

    await this.sms.send(
      phoneNumber,
      `Your Velo code is ${code}. It expires in ${this.ttlMinutes} minutes.`,
    );

    return { message: 'OTP sent', expiresInMinutes: this.ttlMinutes };
  }

  async verifyOtp(phoneNumber: string, code: string) {
    const otp = await this.prisma.otpCode.findFirst({
      where: { phoneNumber },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || otp.expiresAt < new Date()) {
      throw new BadRequestException(
        'Code expired or not found. Request a new one.',
      );
    }
    if (otp.attempts >= this.maxAttempts) {
      await this.prisma.otpCode.delete({ where: { id: otp.id } });
      throw new BadRequestException('Too many attempts. Request a new code.');
    }
    if (otp.code !== code) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid code');
    }

    // Success: the code is single-use, delete it right away.
    await this.prisma.otpCode.delete({ where: { id: otp.id } });

    const user = await this.prisma.user.upsert({
      where: { phoneNumber },
      update: { isVerified: true },
      create: { phoneNumber, isVerified: true },
    });

    const payload: JwtPayload = { sub: user.id, phoneNumber: user.phoneNumber };
    return { accessToken: await this.jwt.signAsync(payload), user };
  }

  /** Removes expired OTP rows so abandoned logins do not pile up. */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async purgeExpiredOtps() {
    const { count } = await this.prisma.otpCode.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (count > 0) this.logger.log(`Purged ${count} expired OTP code(s)`);
  }
}
