import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Provider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParsingRuleDto } from './dto/create-parsing-rule.dto';
import { TestParsingRuleDto } from './dto/test-parsing-rule.dto';
import { UpdateParsingRuleDto } from './dto/update-parsing-rule.dto';
import { checkPattern, matchRule } from './rule-matcher';

function assertUsable(pattern: string, sample?: string | null) {
  const error = checkPattern(pattern, sample);
  if (error) throw new BadRequestException(error);
}

@Injectable()
export class ParsingRulesService {
  constructor(private readonly prisma: PrismaService) {}

  /** What the app downloads on startup, in the order it should try them. */
  findActive(provider?: Provider) {
    return this.prisma.parsingRule.findMany({
      where: { isActive: true, ...(provider && { provider }) },
      orderBy: [{ provider: 'asc' }, { priority: 'asc' }, { name: 'asc' }],
    });
  }

  findAll() {
    return this.prisma.parsingRule.findMany({
      orderBy: [{ provider: 'asc' }, { priority: 'asc' }, { name: 'asc' }],
    });
  }

  async create(dto: CreateParsingRuleDto) {
    assertUsable(dto.pattern, dto.sample);
    try {
      return await this.prisma.parsingRule.create({ data: dto });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException(
          `A rule named ${dto.name} already exists`,
        );
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateParsingRuleDto) {
    const rule = await this.prisma.parsingRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Parsing rule not found');

    const pattern = dto.pattern ?? rule.pattern;
    assertUsable(pattern, dto.sample !== undefined ? dto.sample : rule.sample);

    const patternChanged = pattern !== rule.pattern;
    return this.prisma.parsingRule.update({
      where: { id },
      data: { ...dto, ...(patternChanged && { version: { increment: 1 } }) },
    });
  }

  /** Runs a message through the active rules, the same way the app does. */
  async test(dto: TestParsingRuleDto) {
    const rules = await this.findActive(dto.provider);
    const matches = rules
      .map((rule) => ({ rule, fields: matchRule(rule.pattern, dto.message) }))
      .filter((m) => m.fields !== null)
      .map(({ rule, fields }) => ({
        name: rule.name,
        provider: rule.provider,
        transactionType: rule.transactionType,
        category: rule.category,
        priority: rule.priority,
        fields,
      }));
    return { match: matches[0] ?? null, allMatches: matches };
  }
}
