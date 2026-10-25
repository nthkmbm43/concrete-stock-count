export class UnauthorizedError extends Error {
  statusCode: number = 401;
  code: string = "UNAUTHORIZED";
  constructor(message: string = "กรุณาเข้าสู่ระบบก่อนดำเนินการ (401 Unauthorized)") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  statusCode: number = 403;
  code: string = "FORBIDDEN";
  constructor(
    message: string = "คุณไม่มีสิทธิ์ในการดำเนินการนี้ จำเป็นต้องใช้สิทธิ์ผู้ดูแลระบบ (403 Forbidden)"
  ) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export type UserRole = "STAFF" | "ADMIN";

export interface AuthenticatedUser {
  id: string; // Better Auth user ID
  email: string;
  name: string;
  role: UserRole; // Source of truth from database
  profileId: string;
  fullName: string;
  employeeCode?: string;
  plantId: number;
  phone?: string;
}
