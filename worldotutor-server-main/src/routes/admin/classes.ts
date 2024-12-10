import express from 'express';
import ClassesController from '../../controller/admin/classes';
import { ResponseApi } from '../../core/response';
import { ObjectId } from 'mongodb';

const router = express.Router();

const filters = ["status", "actionRequired", "category", "categoryType", "id", "tutorAttendace", "studentAttendance"]
const sortBy = ["createdAt", "name", "scheduledTime"];

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
        q["categoryType"] = query[key]
        return;
      }
      if (key === "category") {
        q["category.name"] = { $in: query[key].split(",") }
        return;
      }
      if (key === "actionRequired") {
        q["actionRequired"] = { $in: query[key].split(",") }
        return;
      }
      if (key === "id") {
        q["_id"] = new ObjectId(query[key])
        return;
      }
      if (key === "tutorAttendance") {
        q["attendance.tutor"] = query[key]
        return;
      }
      if (key === "studentAttendance") {
        q["attendance.student"] = query[key]
        return;
      }
      q[key] = query[key]
    }
  })
  return q;
}
const getDisputeFilters = (query: any) => {
  let q: { [x: string]: any } = {};
  Object.keys(query).forEach((key) => {
    if (filters.includes(key)) {
      if (!query[key]) return;
      if (key === "status") {
        q["dispute.status"] = query[key]
        return;
      }
      if (key === "categoryType") {
        q["categoryType"] = query[key]
        return;
      }
      if (key === "category") {
        q["category.name"] = { $in: query[key].split(",") }
        return;
      }
      if (key === "actionRequired") {
        q["actionRequired"] = { $in: query[key].split(",") }
        return;
      }
      if (key === "id") {
        q["_id"] = new ObjectId(query[key])
        return;
      }
      if (key === "tutorAttendance") {
        q["attendance.tutor"] = query[key]
        return;
      }
      if (key === "studentAttendance") {
        q["attendance.student"] = query[key]
        return;
      }
      q[key] = query[key]
    }
  })
  return q;
}
const getSorting = (query: any) => {
  let q: { [x: string]: any } = {};
  Object.keys(query).forEach((key) => {
    if (sortBy.includes(key)) {
      if (key === "name") {
        q["user.name"] = Number(query[key])
        return;
      }
      if (key === "scheduledTime") {
        q["scheduledTime.start"] = Number(query[key])
        return
      }
      if (key === "createdAt") {
        q["createdAt"] = Number(query[key])
      }
      q[key] = Number(query[key])
    }
  })
  return q;
}

router.get("/classes", async (req, res) => {
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
  const result = await ClassesController.getAllClasses(filters, sortBy, Number(resultsPerPage), Number(page));
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})


router.get("/classes/disputes", async (req, res) => {
  const filters = getDisputeFilters(req.query);
  const sortBy = getSorting(req.query);
  const { resultsPerPage, page } = req.query

  if (Number(page) <= 0 || Number(resultsPerPage) <= 0) {
    ResponseApi(res, {
      status: "BAD_REQUEST",
      message: "Invalid Parameter"
    })
    return;
  }
  const result = await ClassesController.getAllClassesDisputes(filters, sortBy, Number(resultsPerPage), Number(page));
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.get("/classes/:classId", async (req, res) => {
  const result = await ClassesController.getClassById(req.params.classId);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})


router.get("/classes/facets/categoryName", async (req, res) => {
  const result = await ClassesController.getFacetsByCategoryName();
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

export default router;