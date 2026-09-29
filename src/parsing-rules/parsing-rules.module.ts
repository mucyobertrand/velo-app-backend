import { Module } from '@nestjs/common';
import { ParsingRulesController } from './parsing-rules.controller';
import { ParsingRulesService } from './parsing-rules.service';

@Module({
  controllers: [ParsingRulesController],
  providers: [ParsingRulesService],
})
export class ParsingRulesModule {}
