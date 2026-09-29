import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { safeEqual } from './crypto.util';

/** Protects admin-only endpoints with a shared key sent in the `x-admin-key` header. */
@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header('x-admin-key');
    const expected = this.config.getOrThrow<string>('ADMIN_API_KEY');
    if (!provided || !safeEqual(provided, expected)) {
      throw new UnauthorizedException('Invalid admin key');
    }
    return true;
  }
}
