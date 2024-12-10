import Express from 'express';
import asyncHandler from 'express-async-handler';
import joi from 'joi';
import SessionsController from '../../controller/user/session';
import { ResponseApi } from '../../core/response';
import { getQueryParams } from '../../utils/functions';
import { generateSignature, getZakToken } from '../../utils/zoom';

const router = Express.Router();

router.get("/:userId/sessions", asyncHandler(async (req, res) => {
  const filters = getQueryParams(req.query);
  const result = await SessionsController.getAll(req.params.userId, filters);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
}))

router.post("/:userId/sessions", asyncHandler(async (req, res) => {
  const result = await SessionsController.add(req.body);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
}))

// update
router.put("/:userId/sessions/:sessionId", asyncHandler(async (req, res) => {
  const schema = joi.object({
    status: joi.string(),
    cancelledBy: joi.string().optional(),
    rescheduledBy: joi.string().optional(),
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
  if (error) {
    ResponseApi(res, {
      status: "BAD_REQUEST",
      message: error.message
    })
    return;
  }
  if (value) {
    const result = await SessionsController.update(req.params.sessionId, req.body);
    ResponseApi(res, {
      status: "OK",
      data: result
    })
  }
}))

router.post("/get-signature", async (req, res) => {
  const signature = await generateSignature(req.body.meetId, req.body.role);
  const zakToken = req.body.hostId ? await getZakToken(req.body.hostId) : null;
  ResponseApi(res, {
    status: "OK",
    data: {
      signature,
      zakToken: zakToken ? zakToken.token : null
    },
  })
})

export default router;