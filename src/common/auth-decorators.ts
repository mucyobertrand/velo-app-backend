import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiSecurity,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminKeyGuard } from './admin-key.guard';

/** Swagger security scheme name for the x-admin-key header. */
export const ADMIN_KEY_SECURITY = 'admin-key';

/** Requires a logged-in user (Bearer token from /auth/otp/verify). */
export const UserAuth = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Missing or invalid token' }),
  );

/** Requires the x-admin-key header. */
export const AdminAuth = () =>
  applyDecorators(
    UseGuards(AdminKeyGuard),
    ApiSecurity(ADMIN_KEY_SECURITY),
    ApiUnauthorizedResponse({ description: 'Missing or invalid admin key' }),
  );
