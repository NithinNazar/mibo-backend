// src/types/staff.types.ts

export interface Staff {
  id: number;
  user_id: number;
  designation: string | null;
  profile_picture_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface StaffWithRolesAndCentres {
  user: {
    id: number;
    full_name: string;
    phone: string | null;
    email: string | null;
    username: string | null;
    user_type: string;
    is_active: boolean;
  };
  roles: string[];
  centres: {
    centre_id: number;
    centre_name: string;
    role_name: string;
  }[];
  profile: Staff;
}
