import { Request } from 'express';
import { AdminRole } from '../enums/admin-role.enum';

export interface AuthUser {
  sub: string;
  email: string;
  role: AdminRole;
}

export interface RequestWithUser extends Request {
  user: AuthUser;
}
