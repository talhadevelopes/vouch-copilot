import type { Response } from "express";

export type ApiSuccess<T> = {
  status: "success";
  message: string;
  data: T;
};

export type ApiError = {
  status: "error";
  message: string;
  error: {
    code: string;
    details?: unknown;
  };
};

export class ApiResponse {
  static success<T>(res: Response, message: string, data: T, httpStatus = 200) {
    const payload: ApiSuccess<T> = {
      status: "success",
      message,
      data,
    };
    return res.status(httpStatus).json(payload);
  }

  static error(
    res: Response,
    message: string,
    code = "BAD_REQUEST",
    httpStatus = 400,
    details?: unknown,
  ) {
    const payload: ApiError = {
      status: "error",
      message,
      error: {
        code,
        ...(details !== undefined ? { details } : {}),
      },
    };
    return res.status(httpStatus).json(payload);
  }
}
