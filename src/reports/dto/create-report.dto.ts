import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsObject, Max, Min } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ example: '2026-07-01T00:00:00.000Z' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ example: '2026-09-30T23:59:59.000Z' })
  @IsDateString()
  periodEnd: string;

  /** Aggregated totals computed on the phone (never raw SMS or transactions) */
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: {
      monthlyIncome: 185000,
      totalIncome: 555000,
      totalExpense: 410000,
      byCategory: { transfer: 220000, electricity: 30000, water: 22350 },
    },
  })
  @IsObject()
  summary: Record<string, unknown>;

  @ApiProperty({ example: 720, minimum: 0, maximum: 1000 })
  @IsInt()
  @Min(0)
  @Max(1000)
  veloScore: number;
}
