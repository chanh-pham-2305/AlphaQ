import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../types/roles.type';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const Public = () => Roles('GUEST', 'CUSTOMER', 'ADMIN');

export const GuestOnly = () => Roles('GUEST');

export const Authenticated = () => Roles('CUSTOMER', 'ADMIN');

export const CustomerOnly = () => Roles('CUSTOMER');

export const AdminOnly = () => Roles('ADMIN');
