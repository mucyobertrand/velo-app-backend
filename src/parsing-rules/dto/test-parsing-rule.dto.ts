import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Provider } from '@prisma/client';

export class TestParsingRuleDto {
  /** The full SMS text */
  @ApiProperty({
    example:
      'TxId: 182839201. You have received RWF 5,000 from JOHN DOE (0781234567) on 29/09/2026 at 16:10:05. Your new balance is RWF 15,250. Fee charged: RWF 0.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  /** Only try this provider's rules */
  @ApiPropertyOptional({ enum: Provider, example: Provider.MTN })
  @IsOptional()
  @IsEnum(Provider)
  provider?: Provider;
}
