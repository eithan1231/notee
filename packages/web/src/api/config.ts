import { ApiGenericResponse } from ".";

export type ApiConfig = {
  passwordPreServerSalt: string;
  passwordRegex: string;
  passwordRegexMessage: string;
  feature: {
    authRegisterEnabled: boolean;
    authLoginEnabled: boolean;
  };
  dev: {
    flag: boolean;
    autofillEmail: string | null;
    autofillPassword: string | null;
  };
};

export const apiConfigFetch = async (): Promise<
  ApiGenericResponse<ApiConfig>
> => {
  try {
    const response = await fetch("/api/config/fetch");

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch configuration:", error);
    return { success: false, message: "Failed to fetch configuration" };
  }
};
