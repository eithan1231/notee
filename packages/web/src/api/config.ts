import { ApiGenericResponse } from ".";

export type ApiConfig = {
  passwordPreServerSalt: string;
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
  const response = await fetch("/api/config/fetch", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await response.json();
};
