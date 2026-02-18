export interface RegisterInput {
  name?: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    name?: string;
  };
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
  error?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    name?: string;
    role: "USER" | "ADMIN";
    emailVerified: boolean;
  };
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  emailVerified: boolean;
  role: "USER" | "ADMIN";
}
