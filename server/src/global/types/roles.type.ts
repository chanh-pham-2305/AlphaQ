export const USER_ROLES = ['CUSTOMER', 'ADMIN', 'GUEST'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isValidRole(role: string): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 100,
  CUSTOMER: 10,
  GUEST: 0,
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ['*'],
  CUSTOMER: [''],
  GUEST: ['view_products', 'search_products', 'view_product_detail'],
};
