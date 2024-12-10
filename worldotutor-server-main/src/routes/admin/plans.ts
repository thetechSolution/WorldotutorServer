import express from "express";
import { ResponseApi } from "../../core/response";
import PlansController from "../../controller/admin/plans";

const router = express.Router();

const filters = ["status", "categoryType", "modeOfPayment", "amount", "amountRange"]
const sortBy = ["createdAt", "studentName"];
const changeRequestFilters = ["status"];

const getFilters = (query: any) => {
  let q: { [x: string]: any } = {};
  Object.keys(query).forEach((key) => {
    if (filters.includes(key)) {
      if (!query[key]) return;
      if (key === "amountRange") return;
      if (key === "modeOfPayment") {
        q["paymentDetails.modeOfPayment"] = query[key];
        return;
      }
      if (key === "amount") {
        if (query["amountRange"] === "gt") {
          q["totalCost"] = { $gt: Number(query[key]) }
          return;
        }
        if (query["amountRange"] === "lt") {
          q["totalCost"] = { $lt: Number(query[key]) }
          return;
        }
        if (query["amountRange"] === "eq") {
          q["totalCost"] = { $eq: Number(query[key]) }
          return;
        }
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
      if (key === "studentName") {
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


const getChangeRequestFilters = (query: any) => {
  let q: { [x: string]: any } = {};
  Object.keys(query).forEach((key) => {
    if (changeRequestFilters.includes(key)) {
      if (key === "status") {
        q["changeRequest.status"] = query[key];
        return;
      }
      q[key] = query[key]
    }
  })
  return q;
}

router.get("/plans", async (req, res) => {
  const filters = getFilters(req.query);
  const sortBy = getSorting(req.query);
  const { resultsPerPage, page } = req.query
  const result = await PlansController.getPaginatedPlans(filters, sortBy, Number(page), Number(resultsPerPage));
  ResponseApi(res, {
    status: "OK",
    data: {
      results: result.data,
      count: result.count
    }
  })
})

router.get("/plan/:_id", async (req, res) => {
  const { _id } = req.params
  const result = await PlansController.getById(_id);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.get("/plans/change-requests", async (req, res) => {
  const filters = getChangeRequestFilters(req.query);
  const sortBy = getSorting(req.query);
  const { resultsPerPage, page } = req.query
  const result = await PlansController.getPaginatedChangeRequests(filters, sortBy, Number(page), Number(resultsPerPage));
  ResponseApi(res, {
    status: "OK",
    data: {
      results: result.data,
      count: result.count
    }
  })
})

router.post("/plan/:_id/change-request", async (req, res) => {
  const { _id } = req.params
  const result = await PlansController.handleChangeRequest(_id, req.body.status)
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.put("/plans/:_id/cancel", async (req, res) => {
  const { _id } = req.params
  const result = await PlansController.cancel(_id);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})


router.put("/plans/:_id/status", async (req, res) => {
  const { status } = req.body
  const result = await PlansController.updatePlanStatus(req.params._id, status);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.put("/plans/:_id/payment-status", async (req, res) => {
  const { status } = req.body
  const result = await PlansController.updatePlanPaymentStatus(req.params._id, status);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})


router.put("/plan/:_id", async (req, res) => {
  const { _id } = req.params;
  const result = await PlansController.updatePlan(_id, req.body);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

export default router