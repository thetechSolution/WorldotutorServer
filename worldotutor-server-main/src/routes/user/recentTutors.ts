import express from 'express';
import TutorController from '../../controller/tutor';
import { ResponseApi } from '../../core/response';
import asyncHandler from 'express-async-handler';

const router = express.Router();

// add recently viewed tutors
router.post("/:userId/recent-tutors", asyncHandler(async (req, res) => {
  const result = await TutorController.recentlyViewed(req.body);
  ResponseApi(res, {
    status: "OK",
    data: result,
  });
}));

// Get recently viewed by userId
router.get("/:userId/recent-tutors", asyncHandler(async (req, res, next) => {
  const result = await TutorController.getRecentlyViewedByUserId(req.params.userId);
  ResponseApi(res, {
    status: "OK",
    data: result,
  });
}));


export default router;