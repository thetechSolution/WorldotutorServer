import express from 'express';
import { ResponseApi } from '../../core/response';
import ClassesController from '../../controller/tutor/classes';
import joi from 'joi';

const router = express.Router();

router.get("/:id/classes", async (req, res) => {
  const result = await ClassesController.getAll(req.params.id);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})


router.get("/:id/available-slots", async (req, res) => {
  const schema = joi.string().required()
  const { error } = schema.validate(req.params.id, { presence: "required" });
  if (error) {
    ResponseApi(res, {
      status: "BAD_REQUEST",
      message: error.message
    })
    return;
  }
  const result = await ClassesController.getAvailableSlots(req.params.id);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})



export default router;