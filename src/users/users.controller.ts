import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserAuth } from '../common/auth-decorators';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
@UserAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** The logged-in user */
  @Get('me')
  me(@CurrentUser() user: User) {
    return user;
  }

  /** Update my settings */
  @Patch('me')
  update(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.id, dto);
  }
}
