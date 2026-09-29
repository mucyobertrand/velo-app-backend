import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { LoanApplicationStatus } from '@prisma/client';
import type { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminAuth, UserAuth } from '../common/auth-decorators';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';
import { UpdateLoanStatusDto } from './dto/update-status.dto';
import { LoanApplicationsService } from './loan-applications.service';

@ApiTags('Loan applications')
@Controller('loan-applications')
export class LoanApplicationsController {
  constructor(private readonly service: LoanApplicationsService) {}

  /** Apply to a lender, attaching a signed report (eligibility is checked) */
  @Post()
  @UserAuth()
  apply(@CurrentUser() user: User, @Body() dto: CreateLoanApplicationDto) {
    return this.service.apply(user.id, dto);
  }

  /** My applications */
  @Get()
  @UserAuth()
  findMine(@CurrentUser() user: User) {
    return this.service.findMine(user.id);
  }

  /** All applications (admin / lender back-office) */
  @Get('all')
  @AdminAuth()
  @ApiQuery({ name: 'status', required: false, enum: LoanApplicationStatus })
  findAll(
    @Query(
      'status',
      new ParseEnumPipe(LoanApplicationStatus, { optional: true }),
    )
    status?: LoanApplicationStatus,
  ) {
    return this.service.findAll(status);
  }

  /** One of my applications */
  @Get(':id')
  @UserAuth()
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneOwned(user.id, id);
  }

  /** Withdraw one of my applications */
  @Post(':id/withdraw')
  @HttpCode(200)
  @UserAuth()
  withdraw(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.withdraw(user.id, id);
  }

  /** Set an application's status (admin / lender back-office) */
  @Patch(':id/status')
  @AdminAuth()
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoanStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }
}
