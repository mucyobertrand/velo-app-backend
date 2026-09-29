import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';
import {
  NormalisePhone,
  RWANDA_PHONE_MESSAGE,
  RWANDA_PHONE_REGEX,
} from '../../common/phone';

export class RequestOtpDto {
  /** Any format: 0781234567, +250781234567, 00250781234567 */
  @ApiProperty({ example: '0781234567' })
  @NormalisePhone()
  @Matches(RWANDA_PHONE_REGEX, { message: RWANDA_PHONE_MESSAGE })
  phoneNumber: string;
}
