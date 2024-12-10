import express from 'express';
import { ResponseApi } from '../../core/response';
import EnquiryController from '../../controller/admin/enquiry';
import asyncHandler from 'express-async-handler';

const router = express.Router();

const filters = ["status", "type", "subject"]
const sortBy = ["createdAt", "name"];

const getFilters = (query: any) => {
  let q = {};
  Object.keys(query).forEach((key) => {
    if (filters.includes(key)) {
      // @ts-ignore
      q[key] = query[key]
    }
  })
  return q;
}

const getSorting = (query: any) => {
  let q = {};
  Object.keys(query).forEach((key) => {
    if (sortBy.includes(key)) {
      if (key === "studentName") {
        // @ts-ignore
        q["name"] = Number(query[key])
      } else {
        // @ts-ignore
        q[key] = Number(query[key])
      }
    }
  })
  return q;
}

router.get("/enquiries", asyncHandler(async (req, res) => {
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
  const result = await EnquiryController.get(filters, sortBy, Number(page), Number(resultsPerPage));
  ResponseApi(res, {
    status: "OK",
    data: result
  })
}))

router.get("/enquiries/:enquiryId", asyncHandler(async (req, res) => {
  const result = await EnquiryController.getById(req.params.enquiryId);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
}))


router.put("/enquiries/:enquiryId/status", asyncHandler(async (req, res) => {
  const { enquiryId } = req.params;
  const { action } = req.body;
  const result = await EnquiryController.updateStatus(enquiryId, action);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
}))

export default router;