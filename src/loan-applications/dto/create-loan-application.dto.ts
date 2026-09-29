import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateLoanApplicationDto {
  @ApiProperty({ description: 'Lender to apply to' })
  @IsUUID()
  lenderId: string;

  /** A signed report to attach as proof of loan-readiness */
  @ApiProperty({ description: 'One of your reports' })
  @IsUUID()
  reportId: string;

  @ApiProperty({ example: 200000 })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: 'Stock for my shop' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  purpose?: string;
}
