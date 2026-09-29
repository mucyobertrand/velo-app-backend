import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';
import {
  NormalisePhone,
  RWANDA_PHONE_MESSAGE,
  RWANDA_PHONE_REGEX,
} from '../../common/phone';

export class VerifyOtpDto {
  /** Any format: 0781234567, +250781234567, 00250781234567 */
  @ApiProperty({ example: '0781234567' })
  @NormalisePhone()
  @Matches(RWANDA_PHONE_REGEX, { message: RWANDA_PHONE_MESSAGE })
  phoneNumber: string;

  /** The 6-digit code printed in the server console */
  @ApiProperty({ example: '123456' })
  @Matches(/^\d{6}$/, { message: 'code must be 6 digits' })
  code: string;
}
