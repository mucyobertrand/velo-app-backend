import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { Provider, TransactionCategory, TransactionType } from '@prisma/client';

export class CreateParsingRuleDto {
  /** Unique UPPER_SNAKE_CASE name */
  @ApiProperty({ example: 'MTN_AIRTIME' })
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'name must be UPPER_SNAKE_CASE, e.g. MTN_RECEIVED',
  })
  name: string;

  @ApiProperty({ enum: Provider, example: Provider.MTN })
  @IsEnum(Provider)
  provider: Provider;

  @ApiProperty({ enum: TransactionType, example: TransactionType.expense })
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @ApiPropertyOptional({
    enum: TransactionCategory,
    example: TransactionCategory.airtime,
  })
  @IsOptional()
  @IsEnum(TransactionCategory)
  category?: TransactionCategory;

  /** Regex with named groups (amount, fee, balance, ...) */
  @ApiProperty({
    example:
      '^You have bought airtime of RWF (?<amount>[\\d,]+).*?Balance: RWF (?<balance>[\\d,]+)',
  })
  @IsString()
  @IsNotEmpty()
  pattern: string;

  /** Example SMS the pattern must match. Strongly recommended. */
  @ApiPropertyOptional({
    example:
      'You have bought airtime of RWF 1,000 for 0781234567. Balance: RWF 4,000.',
  })
  @IsOptional()
  @IsString()
  sample?: string;

  /** Lower is tried first (bills 10, transfers 50, fallbacks 100) */
  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
