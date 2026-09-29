import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
} from '@nestjs/common';
import { ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserAuth } from '../common/auth-decorators';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /** Public: Velo's Ed25519 public key, for verifying signatures independently */
  @Get('public-key')
  publicKey() {
    return this.reportsService.publicKey();
  }

  /** Public: lenders check a report by the code printed on it (e.g. VLO-7F2K9Q) */
  @Get('verify/:verifyCode')
  verify(@Param('verifyCode') verifyCode: string) {
    return this.reportsService.verify(verifyCode);
  }

  /** Create a signed report from the summary computed on the phone (premium only) */
  @Post()
  @UserAuth()
  create(@CurrentUser() user: User, @Body() dto: CreateReportDto) {
    return this.reportsService.create(user, dto);
  }

  /** List my reports */
  @Get()
  @UserAuth()
  findMine(@CurrentUser() user: User) {
    return this.reportsService.findMine(user.id);
  }

  /** Get one of my reports */
  @Get(':id')
  @UserAuth()
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.findOneOwned(user.id, id);
  }

  /** Download one of my reports as a watermarked, signed PDF */
  @Get(':id/pdf')
  @UserAuth()
  @ApiProduces('application/pdf')
  @ApiOkResponse({ description: 'The report PDF' })
  @Header('Content-Type', 'application/pdf')
  async pdf(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.renderPdf(user.id, id);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="velo-report-${id}.pdf"`,
    );
    res.send(buffer);
  }

  /** Revoke one of my reports */
  @Post(':id/revoke')
  @HttpCode(200)
  @UserAuth()
  revoke(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.revoke(user.id, id);
  }
}
