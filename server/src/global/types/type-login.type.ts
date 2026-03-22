export const TYPE_LOGINS = ['LOCAL', 'GOOGLE'] as const;
export type TypeLogin = (typeof TYPE_LOGINS)[number];
