import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScoringConfigDto } from './dto/create-scoring-config.dto';

@Injectable()
export class ScoringService {
  constructor(private readonly prisma: PrismaService) {}

  /** The active config the app uses to compute the Velo score. */
  async getActive() {
    const config = await this.prisma.scoringConfig.findFirst({
      where: { isActive: true },
      orderBy: { version: 'desc' },
    });
    if (!config) {
      throw new NotFoundException(
        'No active scoring config. Seed one with npm run db:seed.',
      );
    }
    return config;
  }

  list() {
    return this.prisma.scoringConfig.findMany({ orderBy: { version: 'desc' } });
  }

  /** Publishes a new config version and makes it the only active one. */
  async publish(dto: CreateScoringConfigDto) {
    const totalWeight = dto.factors.reduce((sum, f) => sum + f.weight, 0);
    // Allow tiny floating-point drift around 1.0.
    if (Math.abs(totalWeight - 1) > 0.001) {
      throw new BadRequestException(
        `Factor weights must sum to 1 (got ${totalWeight.toFixed(3)})`,
      );
    }

    const latest = await this.prisma.scoringConfig.findFirst({
      orderBy: { version: 'desc' },
    });
    const version = (latest?.version ?? 0) + 1;

    const [, created] = await this.prisma.$transaction([
      this.prisma.scoringConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      }),
      this.prisma.scoringConfig.create({
        data: {
          version,
          maxScore: dto.maxScore ?? 1000,
          factors: dto.factors as unknown as Prisma.InputJsonValue,
          bands: dto.bands as unknown as Prisma.InputJsonValue,
          isActive: true,
        },
      }),
    ]);
    return created;
  }
}
