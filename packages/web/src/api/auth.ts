import { ApiContext, ApiGenericResponse } from ".";
import {
  createUserEncryption,
  passwordPreServer,
  UserEncryptionData,
} from "../util/encryption";
import { apiConfigFetch } from "./config";

export type ApiAuthResponse = {
  other: {
    /**
     * Is the current session assigned editing permissions
     */
    isActiveEditor: boolean;

    /**
     * Does the user have a session assigned with editing permission
     */
    doesUserHaveActiveEditor: boolean;
  };
  session: {
    expiry: string;
  };
  user: {
    id: string;
    email: string;
    encryption: UserEncryptionData;
  };
};

export const apiAuthLogin = async (
  context: ApiContext,
  email: string,
  password: string,
  remember: boolean = false
): Promise<ApiGenericResponse> => {
  try {
    const config = await apiConfigFetch();

    if (!config.success) {
      return { success: false, message: "Failed to fetch configuration" };
    }

    const hashedPassword = await passwordPreServer(
      password,
      config.data.passwordPreServerSalt
    );

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Tab-Token": context.sessionTabToken ?? "",
      },
      body: JSON.stringify({
        email,
        password: hashedPassword,
        sessionDuration: remember ? "long" : "short",
      }),
    });

    return await response.json();
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
};

export const apiAuthRegister = async (
  context: ApiContext,
  email: string,
  password: string
): Promise<ApiGenericResponse> => {
  try {
    const config = await apiConfigFetch();

    if (!config.success) {
      return { success: false, message: "Failed to fetch configuration" };
    }

    const hashedPassword = await passwordPreServer(
      password,
      config.data.passwordPreServerSalt
    );

    const encryption = await createUserEncryption(password);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Tab-Token": context.sessionTabToken ?? "",
      },
      body: JSON.stringify({
        email,
        password: hashedPassword,
        encryption,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error("Register error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
};

export const apiAuthMe = async (
  context: ApiContext
): Promise<ApiGenericResponse<ApiAuthResponse>> => {
  try {
    const response = await fetch("/api/auth", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Tab-Token": context.sessionTabToken ?? "",
      },
    });

    return await response.json();
  } catch (error) {
    console.error("Fetch user info error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
};

export const apiAuthSetActiveEditor = async (
  context: ApiContext
): Promise<
  ApiGenericResponse<{
    sessionTab: {
      token: string;
    };
  }>
> => {
  const response = await fetch("/api/auth/active-editor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Session-Tab-Token": context.sessionTabToken ?? "",
    },
  });

  return await response.json();
};

export const apiAuthRemoveActiveEditor = async (
  context: ApiContext
): Promise<ApiGenericResponse> => {
  const response = await fetch("/api/auth/active-editor", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "X-Session-Tab-Token": context.sessionTabToken ?? "",
    },
  });

  return await response.json();
};
