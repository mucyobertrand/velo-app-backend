import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLenderDto } from './dto/create-lender.dto';
import { UpdateLenderDto } from './dto/update-lender.dto';

@Injectable()
export class LendersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Active lenders, cheapest first. If a score is given, each lender is marked
   * `eligible` so the app can show which ones the user already qualifies for.
   */
  async findActive(score?: number) {
    const lenders = await this.prisma.lender.findMany({
      where: { isActive: true },
      orderBy: [{ minScore: 'asc' }, { name: 'asc' }],
    });
    if (score === undefined) return lenders;
    return lenders.map((l) => ({ ...l, eligible: score >= l.minScore }));
  }

  findAll() {
    return this.prisma.lender.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const lender = await this.prisma.lender.findUnique({ where: { id } });
    if (!lender) throw new NotFoundException('Lender not found');
    return lender;
  }

  create(dto: CreateLenderDto) {
    return this.prisma.lender.create({ data: dto });
  }

  async update(id: string, dto: UpdateLenderDto) {
    await this.findOne(id);
    return this.prisma.lender.update({ where: { id }, data: dto });
  }
}
