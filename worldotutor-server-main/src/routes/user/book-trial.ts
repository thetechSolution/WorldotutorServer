import express from 'express';
import joi from 'joi';
import ClassesController from '../../controller/user/session';
import { ResponseApi } from '../../core/response';
import { checkUserMeetingExistsAtDate, generateSignature, getUsers, getZakToken } from '../../utils/zoom';
import asyncHandler from "express-async-handler"

const router = express.Router();

// as /session
router.post("/book-trial", async (req, res) => {
  const result = await ClassesController.add(req.body);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.post("/trials/:trialId", async (req, res) => {
  const schema = joi.object({
    status: joi.string(),
    cancelledBy: joi.string().optional(),
    rescheduledBy: joi.array().optional(),
    scheduledTime: joi.object({ start: joi.string(), end: joi.string() }).optional(),
    actionRequired: joi.string().optional().allow(""),
    attendance: joi.object({
      tutor: joi.string().valid("pending", "present", "absent"),
      student: joi.string().valid("pending", "present", "absent")
    }).optional(),
    dispute: joi.object({
      subject: joi.string(),
      description: joi.string(),
      status: joi.string().valid("active", "resolved"),
      raisedBy: joi.string().valid("user", "tutor"),
      createdAt: joi.string(),
      updatedAt: joi.string()
    }).optional()
  }).required();
  const { error, value } = schema.validate(req.body, { presence: "required" });
  console.log(error, value);
  if (error) {
    ResponseApi(res, {
      status: "BAD_REQUEST",
      message: error.message
    })
    return;
  }
  if (value) {
    const result = await ClassesController.update(req.params.trialId, req.body);
    ResponseApi(res, {
      status: "OK",
      data: result
    })
  }
})




export default router;