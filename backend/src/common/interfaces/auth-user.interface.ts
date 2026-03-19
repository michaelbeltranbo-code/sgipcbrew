import { UserRole } from '../../users/user-role.enum';

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
}