import { userService } from '../services/user.service';

export const usersApi = userService;
export type {
  UpdateProfileInput,
  ChangePasswordInput,
  UserProfileResponse,
} from '../services/user.service';
