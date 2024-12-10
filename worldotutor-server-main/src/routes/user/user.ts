import express from "express";
import UserController from "../../controller/user/userController";
import { ResponseApi } from "../../core/response";
import asyncHandler from 'express-async-handler';

const router = express.Router();

//get all users
// router.get("/users", async (req, res) => {
//   const result = await UserController.get();
//   ResponseApi(res, {
//     status: "OK",
//     data: result,
//   });
// });

// Get all users by any filters
router.get("/users", asyncHandler(async (req, res, next) => {
  const { status, _id } = req.query;
  if (typeof _id === "string") {
    const result = await UserController.getById(_id);
    ResponseApi(res, {
      status: 'OK',
      data: result,
    });
    return;
  }
  if (typeof status === "string" || !status) {
    const result = await UserController.getAll(status);
    ResponseApi(res, {
      status: "OK",
      data: result,
    });
  }
}));

// get user by Id
// router.get('/users', asyncHandler( async (req, res) => {
//   const { _id } = req.query;
//   if (typeof _id === "string") {
//     const result = await UserController.getById(_id);
//     ResponseApi(res, {
//       status: 'OK',
//       data: result,
//     });
//   }
// });

//get user by email
router.get("/users/:email", asyncHandler(async (req, res) => {
  const { email } = req.params;
  const result = await UserController.getByEmail(email);
  ResponseApi(res, {
    status: "OK",
    data: result,
  });
}));

//add user
router.post("/users", asyncHandler(async (req, res) => {
  const result = await UserController.add(req.body);
  ResponseApi(res, {
    status: "OK",
    message: "User added successfully",
    data: result,
  });
}));

router.put("/users", asyncHandler(async (req, res) => {
  const result = await UserController.update(req.body);
  ResponseApi(res, {
    status: "OK",
    data: result,
  });
}));

export default router;
