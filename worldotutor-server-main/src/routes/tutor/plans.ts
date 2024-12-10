import express from 'express';
import { ResponseApi } from '../../core/response';
import TutorPlanController from '../../controller/tutor/plans';
import ClassesController from '../../controller/tutor/classes';

const router = express.Router();

router.get("/:id/plans", async (req, res) => {
  const result = await TutorPlanController.get(req.params.id);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.get("/:id/plans", async (req, res) => {
  const { _id } = req.query;
  if (typeof _id === "string") {
    const result = await TutorPlanController.getByStudentId(req.params.id, _id);
    ResponseApi(res, {
      status: "OK",
      data: result
    })
  }
})

router.get("/students", async (req, res) => {
  const { _id } = req.query;
  if (typeof _id === "string") {
    const result = await TutorPlanController.getStudents(_id);
    ResponseApi(res, {
      status: "OK",
      data: result
    })
  }
})

// filters will come here, like date
router.get("/:tutorId/classes", async (req, res) => {
  const tutorId = req.params.tutorId;
  const result = await ClassesController.getAll(tutorId);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

export default router