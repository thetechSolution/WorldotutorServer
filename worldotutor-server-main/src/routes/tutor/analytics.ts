import express from 'express';
import TutorAnalytics from '../../controller/tutor/analytics';
import { ResponseApi } from '../../core/response';

const router = express.Router();

router.get("/:id/sessions-count", async (req, res) => {
  let { startAfter, endBefore = "" } = req.query;
  if (!startAfter) {
    startAfter = new Date(0).toString();
  }
  if (typeof startAfter === "string" && typeof endBefore === "string") {
    const result = await TutorAnalytics.getSessionsCount(req.params.id, startAfter, endBefore);
    ResponseApi(res, {
      status: "OK",
      data: result
    })
  }
})

router.get("/:id/earnings", async (req, res) => {
  let { startAfter, endBefore = "" } = req.query;
  if (!startAfter) {
    startAfter = new Date(0).toString();
  }
  if (typeof startAfter === "string" && typeof endBefore === "string") {
    const result = await TutorAnalytics.getEarnings(req.params.id, startAfter, endBefore);
    ResponseApi(res, {
      status: "OK",
      data: result
    })
  }
})

router.get("/:id/deductions", async (req, res) => {
  let { startAfter, endBefore = "" } = req.query;
  if (!startAfter) {
    startAfter = new Date(0).toString();
  }
  if (typeof startAfter === "string" && typeof endBefore === "string") {
    const result = await TutorAnalytics.getDeductions(req.params.id, startAfter, endBefore);
    ResponseApi(res, {
      status: "OK",
      data: result
    })
  }
})


router.get("/:id/max-earnings", async (req, res) => {
  const result = await TutorAnalytics.getMaxEarnings(req.params.id);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})
router.get("/:id/estimated-earnings", async (req, res) => {
  let { startAfter, endBefore = "" } = req.query;
  if (!startAfter) {
    startAfter = new Date(0).toString();
  }
  if (typeof startAfter === "string" && typeof endBefore === "string") {
    const result = await TutorAnalytics.getEstimatedEarnings(req.params.id, startAfter, endBefore);
    ResponseApi(res, {
      status: "OK",
      data: result
    })
  }
})

router.get("/:id/stats/plans-count", async (req, res) => {
  let { startAfter, endBefore = "" } = req.query;
  if (!startAfter) {
    startAfter = new Date(0).toString();
  }
  if (typeof startAfter === "string" && typeof endBefore === "string") {
    const result = await TutorAnalytics.getPlansCount(req.params.id, startAfter, endBefore);
    ResponseApi(res, {
      status: "OK",
      data: result
    })
  }
})
router.get("/:id/stats/students-count", async (req, res) => {
  let { startAfter, endBefore = "" } = req.query;
  if (!startAfter) {
    startAfter = new Date(0).toString();
  }
  if (typeof startAfter === "string" && typeof endBefore === "string") {
    const result = await TutorAnalytics.getStudentsCount(req.params.id, startAfter, endBefore);
    ResponseApi(res, {
      status: "OK",
      data: result
    })
  }
})

export default router;