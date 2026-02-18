"use client";

import { useState } from "react";
import { authApi, ApiError } from "@/app/lib/api-client";
import { RegisterInput } from "@/app/types/auth";

interface UseRegisterReturn {
  register: (input: RegisterInput) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  fieldErrors: Record<string, string[]> | null;
  isSuccess: boolean;
  reset: () => void;
}

export function useRegister(): UseRegisterReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<
    string,
    string[]
  > | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const register = async (input: RegisterInput) => {
    setIsLoading(true);
    setError(null);
    setFieldErrors(null);
    setIsSuccess(false);

    try {
      await authApi.register(input);
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.errors || null);
      } else {
        setError("An unexpected error occurred. Please try again.");
        console.error("Registration error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setFieldErrors(null);
    setIsSuccess(false);
  };

  return {
    register,
    isLoading,
    error,
    fieldErrors,
    isSuccess,
    reset,
  };
}
