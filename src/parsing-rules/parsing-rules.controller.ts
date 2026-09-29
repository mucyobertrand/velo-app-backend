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
import { Provider } from '@prisma/client';
import { AdminAuth } from '../common/auth-decorators';
import { CreateParsingRuleDto } from './dto/create-parsing-rule.dto';
import { TestParsingRuleDto } from './dto/test-parsing-rule.dto';
import { UpdateParsingRuleDto } from './dto/update-parsing-rule.dto';
import { ParsingRulesService } from './parsing-rules.service';

@ApiTags('Parsing rules')
@Controller('parsing-rules')
export class ParsingRulesController {
  constructor(private readonly parsingRulesService: ParsingRulesService) {}

  /** Active rules for the app, in the order they should be tried */
  @Get()
  @ApiQuery({ name: 'provider', enum: Provider, required: false })
  findActive(
    @Query('provider', new ParseEnumPipe(Provider, { optional: true }))
    provider?: Provider,
  ) {
    return this.parsingRulesService.findActive(provider);
  }

  /** All rules, including inactive ones */
  @Get('all')
  @AdminAuth()
  findAll() {
    return this.parsingRulesService.findAll();
  }

  /** Create a rule (rejected if the pattern does not match its sample) */
  @Post()
  @AdminAuth()
  create(@Body() dto: CreateParsingRuleDto) {
    return this.parsingRulesService.create(dto);
  }

  /** Try an SMS against the active rules to see what the app would extract */
  @Post('test')
  @HttpCode(200)
  @AdminAuth()
  test(@Body() dto: TestParsingRuleDto) {
    return this.parsingRulesService.test(dto);
  }

  /** Update a rule (changing the pattern bumps its version) */
  @Patch(':id')
  @AdminAuth()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParsingRuleDto,
  ) {
    return this.parsingRulesService.update(id, dto);
  }
}
