import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTipDto } from './dto/create-tip.dto';
import { UpdateTipDto } from './dto/update-tip.dto';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  /** Active tips for the app, filtered by language. */
  findActive(language = 'rw') {
    return this.prisma.contentTip.findMany({
      where: { isActive: true, language },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
  }

  findAll() {
    return this.prisma.contentTip.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(dto: CreateTipDto) {
    return this.prisma.contentTip.create({ data: dto });
  }

  async update(id: string, dto: UpdateTipDto) {
    const tip = await this.prisma.contentTip.findUnique({ where: { id } });
    if (!tip) throw new NotFoundException('Tip not found');
    return this.prisma.contentTip.update({ where: { id }, data: dto });
  }
}
