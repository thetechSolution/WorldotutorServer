import express from 'express';
import { Category } from '../../controller/admin/categories';
import asyncHandler from "express-async-handler"
import { ResponseApi } from '../../core/response';

const router = express.Router();

router.post("/categories", asyncHandler(async (req, res) => {
  let categories = req.body;
  const result = await Category.add(categories);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
}))

router.put("/categories", asyncHandler(async (req, res) => {
  const result = await Category.update(req.body);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
}))


export default router;