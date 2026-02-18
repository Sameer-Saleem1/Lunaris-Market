import {
  LoginInput,
  LoginResponse,
  RegisterInput,
  RegisterResponse,
} from "@/app/types/auth";

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  try {
    const response = await fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // Not JSON - likely an error page or server issue
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      throw new ApiError(
        `Server returned a non-JSON response for ${endpoint}. Check the API route and server logs.`,
        response.status,
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || "An error occurred",
        response.status,
        data.errors,
      );
    }

    return data;
  } catch (err) {
    // If it's already an ApiError, rethrow it
    if (err instanceof ApiError) {
      throw err;
    }
    
    // Handle other errors (network, parsing, etc.)
    throw new ApiError(
      err instanceof Error ? err.message : "Network error occurred",
      500,
    );
  }
}

export const authApi = {
  register: async (input: RegisterInput): Promise<RegisterResponse> => {
    return fetchApi<RegisterResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  login: async (input: LoginInput): Promise<LoginResponse> => {
    return fetchApi<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};

export { ApiError };
