import express from "express";
import UserRequirementController from "../../controller/user/userRequirementController";
import { ResponseApi } from "../../core/response";
import asyncHandler from "express-async-handler"

const router = express.Router();

router.post("/:userId/post-requirement", asyncHandler(async (req, res) => {
  const result = await UserRequirementController.add(req.body);
  ResponseApi(res, {
    status: "OK",
    message: "Requirement added successfully",
    data: result,
  });
}));

router.get("/:userId/post-requirement", asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const result = await UserRequirementController.getByUserId(userId);
  ResponseApi(res, {
    status: "OK",
    data: result,
  });
}));

router.put("/:userId/post-requirement/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await UserRequirementController.update(id, req.body);
  ResponseApi(res, {
    status: "OK",
    data: result,
  });
}));

router.delete("/:userId/post-requirement/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await UserRequirementController.remove(id);
  ResponseApi(res, {
    status: "OK",
    message: "Requirement deleted successfully",
    data: result,
  });
}));

export default router;
