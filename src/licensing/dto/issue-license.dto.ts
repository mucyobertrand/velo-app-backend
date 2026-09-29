import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';
import {
  NormalisePhone,
  RWANDA_PHONE_MESSAGE,
  RWANDA_PHONE_REGEX,
} from '../../common/phone';

export class IssueLicenseDto {
  /** MoMo transaction ID the customer gave as proof of payment. */
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'MP260929.1612.A12345' })
  momoReference?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ example: 5000 })
  amountPaid?: number;

  /** If given, the code is also sent to this number by SMS. */
  @IsOptional()
  @NormalisePhone()
  @Matches(RWANDA_PHONE_REGEX, { message: RWANDA_PHONE_MESSAGE })
  @ApiPropertyOptional({ example: '0781234567' })
  sendToPhone?: string;
}
