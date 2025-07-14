export type ApiGenericResponse<T = undefined> =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      message?: string;
      data: T;
    };

export type ApiContext = {
  sessionTabToken?: string;
};
