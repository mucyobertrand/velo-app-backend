import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminAuth, UserAuth } from '../common/auth-decorators';
import { IssueLicenseDto } from './dto/issue-license.dto';
import { RedeemLicenseDto } from './dto/redeem-license.dto';
import { LicensingService } from './licensing.service';

@ApiTags('Licensing')
@Controller('licensing')
export class LicensingController {
  constructor(private readonly licensingService: LicensingService) {}

  /** Redeem an unlock code to get premium */
  @Post('redeem')
  @HttpCode(200)
  @UserAuth()
  redeem(@CurrentUser() user: User, @Body() dto: RedeemLicenseDto) {
    return this.licensingService.redeem(user.id, dto.code);
  }

  /** Issue an unlock code after confirming a MoMo payment (code is shown only once) */
  @Post('codes')
  @AdminAuth()
  issue(@Body() dto: IssueLicenseDto) {
    return this.licensingService.issue(dto);
  }

  /** List all unlock codes */
  @Get('codes')
  @AdminAuth()
  list() {
    return this.licensingService.list();
  }

  /** Revoke an unlock code */
  @Post('codes/:id/revoke')
  @HttpCode(200)
  @AdminAuth()
  revoke(@Param('id', ParseUUIDPipe) id: string) {
    return this.licensingService.revoke(id);
  }
}
