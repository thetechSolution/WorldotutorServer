import express from 'express';
import TutorController from '../../controller/tutor';
import { ResponseApi } from '../../core/response';
import asyncHandler from 'express-async-handler';
import { tutorsCollection } from '../../config/mongodb-config';

const router = express.Router();

const filters = ["status", "categoryType", "level"];
const sortBy = ["createdAt"];

const getFilters = (query: any) => {
  let q: { [x: string]: any } = {};
  Object.keys(query).forEach((key) => {
    if (filters.includes(key)) {
      if (!query[key]) return;
      if (key === "status") {
        q["status"] = query[key]
        return;
      }
      if (key === "categoryType") {
        q["profession.data.categoryType"] = query[key];
        return;
      }
      if (key === "level") {
        q["agreement.level"] = query[key];
        return;
      }
      q[key] = query[key];
    }
  })
  return q;
}

const getSorting = (query: any) => {
  let q: { [x: string]: any } = {};
  Object.keys(query).forEach((key) => {
    if (sortBy.includes(key)) {
      if (key === "createdAt") {
        q["createdAt"] = Number(query[key])
        return;
      }
      q[key] = Number(query[key])
    }
  })
  return q;
}

router.get("/tutors", asyncHandler(async (req, res) => {
  const filters = getFilters(req.query);
  const sortBy = getSorting(req.query);
  const { resultsPerPage, page } = req.query
  if (Number(page) <= 0 || Number(resultsPerPage) <= 0) {
    ResponseApi(res, {
      status: "BAD_REQUEST",
      message: "Invalid Parameter"
    })
    return;
  }
  const result = await TutorController.getAllPaginated(filters, sortBy, Number(resultsPerPage), Number(page));
  ResponseApi(res, {
    status: "OK",
    data: { ...result }
  })
}))

router.post("/request-video/:email", asyncHandler(async (req, res) => {
  const { email } = req.params;
  const result = await TutorController.sendIntroVideoRequest(email);
  ResponseApi(res, {
    status: "OK",
    data: result,
  });
}));

router.put("/add-video", asyncHandler(async (req, res) => {
  const result = await TutorController.addIntroVideo(req.body);
  ResponseApi(res, {
    status: "OK",
    data: result,
  });
}));



export default router;