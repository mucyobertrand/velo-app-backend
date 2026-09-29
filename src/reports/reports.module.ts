import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { SigningService } from './signing.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, SigningService, PdfService],
})
export class ReportsModule {}
