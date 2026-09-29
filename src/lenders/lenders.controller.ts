import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminAuth } from '../common/auth-decorators';
import { CreateLenderDto } from './dto/create-lender.dto';
import { UpdateLenderDto } from './dto/update-lender.dto';
import { LendersService } from './lenders.service';

@ApiTags('Lenders')
@Controller('lenders')
export class LendersController {
  constructor(private readonly lendersService: LendersService) {}

  /** Active lenders. Pass ?score= to mark which ones the user qualifies for */
  @Get()
  @ApiQuery({ name: 'score', required: false, type: Number })
  findActive(
    @Query('score', new ParseIntPipe({ optional: true })) score?: number,
  ) {
    return this.lendersService.findActive(score);
  }

  /** All lenders, including inactive */
  @Get('all')
  @AdminAuth()
  findAll() {
    return this.lendersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.lendersService.findOne(id);
  }

  @Post()
  @AdminAuth()
  create(@Body() dto: CreateLenderDto) {
    return this.lendersService.create(dto);
  }

  @Patch(':id')
  @AdminAuth()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLenderDto) {
    return this.lendersService.update(id, dto);
  }
}
