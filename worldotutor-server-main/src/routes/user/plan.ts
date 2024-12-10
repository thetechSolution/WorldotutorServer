import express from "express";
import PlansController from "../../controller/user/plan";
import { ResponseApi } from "../../core/response";
import asyncHandler from "express-async-handler"

const router = express.Router();

router.get("/:userId/plans", async (req, res) => {
  const result = await PlansController.get(req.params.userId);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.get("/:userId/plans/:id", async (req, res) => {
  const result = await PlansController.getById(req.params.id);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.post("/:userId/plans", async (req, res) => {
  const result = await PlansController.create(req.body);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.post("/:userId/plan-draft", async (req, res) => {
  const body = req.body;
  const result = await PlansController.addPlanDraft(body);
  ResponseApi(res, {
    status: "OK",
    message: "draft plan added",
    data: result
  })
})

router.post("/extend-online", async (req, res) => {
  const body = req.body;
  const result = await PlansController.extendPlanDraft(body);
  ResponseApi(res, {
    status: "OK",
    message: "plan added",
    data: result
  })
})

router.post("/extend-cash", async (req, res) => {
  const body = req.body;
  const result = await PlansController.extend(body);
  ResponseApi(res, {
    status: "OK",
    message: "plan added",
    data: result
  })
})

router.post("/plans/change-tutor-request", asyncHandler(async (req, res) => {
  const body = req.body;
  const result = await PlansController.changeRequest(body);
  ResponseApi(res, {
    status: "OK",
    message: "Tutor change request added successfully",
    data: result
  })
}))

router.put("/plans/change-tutor-request", asyncHandler(async (req, res) => {
  const body = req.body;
  const result = await PlansController.deleteChangeRequest(body.planId);
  ResponseApi(res, {
    status: "OK",
    message: "Tutor change request deleted successfully",
    data: result
  })
}))

router.put("/:userId/plans/:planId/add-sessions", asyncHandler(async (req, res, next) => {
  const result = await PlansController.addSessions(req.body);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
}))

router.post("/plans/:planId/cancel", asyncHandler(async (req, res) => {
  const { planId } = req.params
  const result = await PlansController.cancel(planId);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
}))

router.get("/:userId/plans/:planId/sessions", async (req, res) => {
  const result = await PlansController.getSessions(req.params.planId);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.get("/:userId/attendance", async (req, res) => {
  const result = await PlansController.getPlansAttendance(req.params.userId);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.get("/:userId/plans/:planId/attendance", async (req, res) => {
  const result = await PlansController.getPlanAttendance(req.params.planId);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.get("/:userId/plans/:planId/suggested-tutors", async (req, res) => {
  const result = await PlansController.getPlanSuggestedTutors(req.params.planId);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.put("/:userId/plans/:planId/assign-tutor", async (req, res) => {
  const result = await PlansController.assignNewTutor(req.params.planId, req.body.tutorId);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

export default router;