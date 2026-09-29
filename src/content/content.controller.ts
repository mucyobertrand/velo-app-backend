import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminAuth } from '../common/auth-decorators';
import { CreateTipDto } from './dto/create-tip.dto';
import { UpdateTipDto } from './dto/update-tip.dto';
import { ContentService } from './content.service';

@ApiTags('Content')
@Controller('content/tips')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  /** Active financial tips for the app, by language (rw/en/fr) */
  @Get()
  @ApiQuery({ name: 'language', required: false, example: 'rw' })
  findActive(@Query('language') language?: string) {
    return this.contentService.findActive(language);
  }

  /** All tips, including inactive */
  @Get('all')
  @AdminAuth()
  findAll() {
    return this.contentService.findAll();
  }

  @Post()
  @AdminAuth()
  create(@Body() dto: CreateTipDto) {
    return this.contentService.create(dto);
  }

  @Patch(':id')
  @AdminAuth()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTipDto) {
    return this.contentService.update(id, dto);
  }
}
