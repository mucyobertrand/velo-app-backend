import { PartialType } from '@nestjs/swagger';
import { CreateParsingRuleDto } from './create-parsing-rule.dto';

export class UpdateParsingRuleDto extends PartialType(CreateParsingRuleDto) {}
