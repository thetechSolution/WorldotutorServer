import express from 'express';
import { Pricing } from '../../controller/admin/pricing';
import { ResponseApi } from '../../core/response';
import asyncHandler from 'express-async-handler';

const router = express.Router();

router.post("/pricing", asyncHandler(async (req, res) => {
  const pricing = req.body;
  const result = await Pricing.addPricing(pricing);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
}))

router.put("/pricing", asyncHandler(async (req, res) => {
  const pricing = req.body;
  const result = await Pricing.udpdatePricing(pricing._id, pricing);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
}))


export default router;