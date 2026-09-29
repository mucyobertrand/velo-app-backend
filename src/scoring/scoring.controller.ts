import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuth } from '../common/auth-decorators';
import { CreateScoringConfigDto } from './dto/create-scoring-config.dto';
import { ScoringService } from './scoring.service';

@ApiTags('Scoring')
@Controller('scoring-config')
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  /** The active score formula the app downloads */
  @Get()
  active() {
    return this.scoringService.getActive();
  }

  /** All config versions */
  @Get('all')
  @AdminAuth()
  list() {
    return this.scoringService.list();
  }

  /** Publish a new version (weights must sum to 1) and make it active */
  @Post()
  @AdminAuth()
  publish(@Body() dto: CreateScoringConfigDto) {
    return this.scoringService.publish(dto);
  }
}
