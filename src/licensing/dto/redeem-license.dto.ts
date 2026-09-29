import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RedeemLicenseDto {
  /** The code from POST /licensing/codes */
  @ApiProperty({ example: 'VELO-AB23-CD45' })
  @IsString()
  @Length(4, 32)
  code: string;
}
