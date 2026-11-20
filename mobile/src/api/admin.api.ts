import { adminService } from '../services/admin.service';

export const adminApi = adminService;
export type {
  GetUsersParams,
  GetUsersResponse,
  AdminUserDetail,
  AdminAuditLog,
  GetVerificationsParams,
  GetVerificationsResponse,
  ProcessVerificationInput,
} from '../services/admin.service';
