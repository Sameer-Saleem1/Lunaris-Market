"use client";

import { useState } from "react";
import { authApi, ApiError } from "@/app/lib/api-client";
import { LoginInput } from "@/app/types/auth";

interface UseLoginReturn {
  login: (input: LoginInput) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  fieldErrors: Record<string, string[]> | null;
  isSuccess: boolean;
  reset: () => void;
}

export function useLogin(): UseLoginReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<
    string,
    string[]
  > | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const login = async (input: LoginInput) => {
    setIsLoading(true);
    setError(null);
    setFieldErrors(null);
    setIsSuccess(false);

    try {
      await authApi.login(input);
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.errors || null);
      } else {
        setError("An unexpected error occurred. Please try again.");
        console.error("Login error:", err);
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
    login,
    isLoading,
    error,
    fieldErrors,
    isSuccess,
    reset,
  };
}
