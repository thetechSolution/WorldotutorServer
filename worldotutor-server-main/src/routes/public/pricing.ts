import express from 'express';
import { Pricing } from '../../controller/admin/pricing';
import joi from 'joi';
import { ResponseApi } from '../../core/response';

const router = express.Router();

router.get("/pricing", async (req, res) => {
  const { type } = req.query;
  if (typeof type === 'string') {
    const result = await Pricing.getPricing(type);
    ResponseApi(res, {
      status: "OK",
      data: result
    })
  }
})

router.get("/pricing/:categoryType", async (req, res) => {
  const { grade, level, tutorType } = req.query;
  const schema = joi.object({
    grade: joi.string().optional().allow(""),
    level: joi.string().optional().allow(""),
    tutorType: joi.string().required().allow("standard", "premium"),
  }).required();
  const { error, value } = schema.validate(req.query, { presence: "required" });
  if (error) {
    ResponseApi(res, {
      status: "BAD_REQUEST",
      message: error.message
    })
    return;
  }
  // @ts-ignore
  const result = await Pricing.getPricingOf(req.params.categoryType, grade, level, tutorType);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

export default router;