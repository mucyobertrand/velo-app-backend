import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LoanApplicationStatus } from '@prisma/client';

// The applicant withdraws; the lender back-office sets the others.
const LENDER_STATUSES = [
  LoanApplicationStatus.under_review,
  LoanApplicationStatus.approved,
  LoanApplicationStatus.rejected,
] as const;

export class UpdateLoanStatusDto {
  @ApiProperty({ enum: LENDER_STATUSES })
  @IsEnum(LoanApplicationStatus)
  status: LoanApplicationStatus;

  @ApiPropertyOptional({ example: 'Approved for 150,000 over 6 months' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  lenderNote?: string;
}
