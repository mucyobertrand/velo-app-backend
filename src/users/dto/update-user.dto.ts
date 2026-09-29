import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export const SUPPORTED_LANGUAGES = ['rw', 'en', 'fr'];

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: SUPPORTED_LANGUAGES, example: 'en' })
  @IsOptional()
  @IsIn(SUPPORTED_LANGUAGES)
  language?: string;
}
