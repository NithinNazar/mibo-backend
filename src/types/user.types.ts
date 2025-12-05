// src/types/user.types.ts

export type UserType = "PATIENT" | "STAFF";

export interface User {
  id: number;
  phone: string | null;
  email: string | null;
  username: string | null;
  password_hash?: string;
  full_name: string;
  user_type: UserType;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
}

export interface UserWithRoles extends User {
  roles: string[];
  centreIds?: number[];
}
