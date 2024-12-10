import { logger } from "../core/logger";
import { ApiResponse, RESPONSE_CODES_MAP, ResponseApi } from "../core/response";
import { NextFunction, Request, Response } from "express";


type TypedRequest<
  ReqBody = Record<string, unknown>,
  QueryString = Record<string, unknown>
> = Request<
  Record<string, unknown>,
  Record<string, unknown>,
  Partial<ReqBody>,
  Partial<QueryString>
>;

export type ExpressMiddleware<
  ReqBody = Record<string, unknown>,
  Res = Record<string, unknown>,
  QueryString = Record<string, unknown>
> = (
  err: ApiResponse,
  req: TypedRequest<ReqBody, QueryString>,
  res: Response<Res>,
  next: NextFunction
) => Promise<void> | void;

export const logError: ExpressMiddleware = (err, req, res, next) => {
  logger.error(err);
  next(err);
}

export const returnError: ExpressMiddleware = (err, req, res, next) => {
  ResponseApi(res, {
    status: err.status || "FAILED",
    message: err.message || "Internal Server Error!"
  })
  // res.status(RESPONSE_CODES_MAP[err.status] || 500).json({ message: err.message || "Internal Server Error!" })
}
