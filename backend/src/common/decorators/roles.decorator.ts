import { SetMetadata } from '@nestjs/common';

export type Role = 'admin' | 'school_admin' | 'teacher';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
