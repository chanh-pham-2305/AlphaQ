export const SORT_FIELDS = [
  'id',
  'email',
  'username',
  'fullname',
  'birthDate',
  'role',
  'createdAt',
  'updatedAt',
] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];
