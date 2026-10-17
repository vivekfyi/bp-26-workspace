import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import type { Request } from 'express';

export type ClerkRequest = Request & {
  clerkUserId?: string;
};

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly adminOnly = false) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ClerkRequest>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    const secretKey = process.env.CLERK_SECRET_KEY;

    if (!token || !secretKey) {
      throw new UnauthorizedException('A valid Clerk session is required.');
    }

    try {
      const verifiedToken = await verifyToken(token, { secretKey });
      const userId = verifiedToken.sub;
      if (!userId) throw new UnauthorizedException('The Clerk token has no user id.');
      request.clerkUserId = userId;

      if (this.adminOnly && !this.adminUserIds().includes(userId)) {
        throw new ForbiddenException('Admin access is required.');
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new UnauthorizedException('The Clerk session is invalid or expired.');
    }
  }

  private adminUserIds() {
    return (process.env.CLERK_ADMIN_USER_IDS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }
}

@Injectable()
export class ClerkAdminGuard extends ClerkAuthGuard {
  constructor() {
    super(true);
  }
}
