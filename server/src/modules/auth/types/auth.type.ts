import { User } from 'src/generated/prisma/client';

export type SuccessResponse<T = any> = {
  statusCode: number;
  message: string;
  data?: T;
};

export type LocalUser = Omit<User, 'password'>;
export type AtUser = {
  userId: string;
  email: string;
};

export type RtUser = {
  userId: string;
  email: string;
  RTId: string;
};

export type GoogleUserInput = Pick<
  User,
  'email' | 'googleId' | 'fullname' | 'avatarUrl'
>;

export type ForgotPasswordInput = {
  userId: string;
  newPassword: string;
  reNewPassword: string;
};

export type ChangePasswordInput = {
  userId: string;
  currentPassword: string;
  newPassword: string;
  reNewPassword: string;
};

export type SetPasswordInput = {
  userId: string;
  newPassword: string;
  reNewPassword: string;
};
