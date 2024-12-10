import express from 'express';
import { ResponseApi } from '../../core/response';
import AStudentController from '../../controller/admin/students';

const router = express.Router();

const filters = ["status"]
const sortBy = ["createdAt", "name"];

const getFilters = (query: any) => {
  let q = {};
  Object.keys(query).forEach((key) => {
    if (filters.includes(key)) {
      if (key === "status") {
        // @ts-ignore
        q["status"] = query[key]
        return;
      }
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
      if (key === "name") {
        // @ts-ignore
        q["user.name"] = Number(query[key])
      } else {
        // @ts-ignore
        q[key] = Number(query[key])
      }
    }
  })
  return q;
}

router.get("/students", async (req, res) => {
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
  const result = await AStudentController.getAllStudents(filters, sortBy, Number(resultsPerPage), Number(page));
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})


export default router;