import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ContentModule } from './content/content.module';
import { LendersModule } from './lenders/lenders.module';
import { LicensingModule } from './licensing/licensing.module';
import { LoanApplicationsModule } from './loan-applications/loan-applications.module';
import { ParsingRulesModule } from './parsing-rules/parsing-rules.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { ScoringModule } from './scoring/scoring.module';
import { SmsModule } from './sms/sms.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    SmsModule,
    UsersModule,
    AuthModule,
    LicensingModule,
    ParsingRulesModule,
    ReportsModule,
    ScoringModule,
    LendersModule,
    LoanApplicationsModule,
    ContentModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
