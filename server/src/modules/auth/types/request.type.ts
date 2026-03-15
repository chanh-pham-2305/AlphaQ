import { Request } from 'express';
import { AtUser, LocalUser, RtUser } from './auth.type';
export interface RequestWithLocal extends Request {
  user: LocalUser;
}
export interface RequestWithAt extends Request {
  user: AtUser;
}
export interface RequestWithRt extends Request {
  user: RtUser;
}
