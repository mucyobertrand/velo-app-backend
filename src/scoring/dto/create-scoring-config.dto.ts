import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ScoringFactorDto {
  @ApiProperty({ example: 'income_stability' })
  @IsString()
  key: string;

  @ApiProperty({ example: 'Income stability' })
  @IsString()
  label: string;

  /** Share of the total score (all weights should sum to 1) */
  @ApiProperty({ example: 0.3 })
  @IsNumber()
  @Min(0)
  @Max(1)
  weight: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class ScoringBandDto {
  @ApiProperty({ example: 650 })
  @IsInt()
  @Min(0)
  min: number;

  @ApiProperty({ example: 799 })
  @IsInt()
  @Min(0)
  max: number;

  @ApiProperty({ example: 'Good' })
  @IsString()
  label: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recommendation?: string;
}

export class CreateScoringConfigDto {
  @ApiPropertyOptional({ example: 1000, default: 1000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxScore?: number;

  @ApiProperty({ type: [ScoringFactorDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoringFactorDto)
  factors: ScoringFactorDto[];

  @ApiProperty({ type: [ScoringBandDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoringBandDto)
  bands: ScoringBandDto[];
}
