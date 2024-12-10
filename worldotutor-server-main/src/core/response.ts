import { NextFunction, Request, Response } from "express";


type RESPONSE_CODES =
  | "OK"               // 200
  | "CREATED"          // 201
  | "BAD_REQUEST"      // 400
  | "UNAUTHENTICATED"  // 401
  | "FORBIDDEN"        // 403
  | "NOT_FOUND"        // 404
  | "FAILED"           // 500
  | "CRASHED"          // 503

export const RESPONSE_CODES_MAP = {
  "OK": 200,
  "CREATED": 201,
  "BAD_REQUEST": 400,
  "UNAUTHENTICATED": 401,
  "FORBIDDEN": 403,
  "NOT_FOUND": 404,
  "FAILED": 500,
  "CRASHED": 503,
}


export interface ApiResponse {
  status: RESPONSE_CODES,
  message?: string,
  data?: any
}


export function ResponseApi(res: Response<Record<string, unknown>>, { status, message, data }: ApiResponse) {
  res.status(RESPONSE_CODES_MAP[status]).json({
    status,
    message,
    data
  })
}

