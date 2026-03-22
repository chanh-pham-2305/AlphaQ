import { UserRole } from 'src/global/types/roles.type';

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};
export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole[];
};

export type RefreshTokenInput = {
  userId: string;
  email: string;
  RTId: string;
  role: UserRole[];
};

export type ATGoogleInput = {
  googleId: string;
  accessToken: string;
};

export type SaveRTInput = {
  userId: string;
  refreshToken: string;
  googleId?: string;
  expires?: number;
};
