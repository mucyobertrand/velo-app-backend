import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export const TIP_LANGUAGES = ['rw', 'en', 'fr'];

export class CreateTipDto {
  @ApiProperty({ example: 'Save before you spend' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Set aside a small amount each time income arrives.',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ enum: TIP_LANGUAGES, default: 'rw' })
  @IsOptional()
  @IsIn(TIP_LANGUAGES)
  language?: string;

  @ApiPropertyOptional({ example: 'saving' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
