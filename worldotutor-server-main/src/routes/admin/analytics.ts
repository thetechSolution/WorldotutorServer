import express from "express";
import Stripe from "stripe";
import { userTransactions } from "../../config/mongodb-config";
import AnalyticsController from "../../controller/admin/analytics";
import { ResponseApi } from "../../core/response";

const router = express.Router();

router.get("/stats", async (req, res) => {
  let { startAfter, endBefore = "" } = req.query;
  if (!startAfter) {
    startAfter = new Date(0).toString();
  }
  if (typeof startAfter === "string" && typeof endBefore === "string") {
    const plansCount = await AnalyticsController.getPlansCount(startAfter, endBefore);
    const classesCount = await AnalyticsController.getClassesCount(startAfter, endBefore);
    const studentsCount = await AnalyticsController.getStudentsCount(startAfter, endBefore);
    const tutorsCount = await AnalyticsController.getTutorsCount(startAfter, endBefore);
    ResponseApi(res, {
      status: "OK",
      data: {
        plansCount,
        classesCount,
        studentsCount,
        tutorsCount
      }
    })
  } else {
    ResponseApi(res, {
      status: "BAD_REQUEST",
      message: "invalid parameter"
    })
  }
})

router.get("/stats/earnings", async (req, res) => {
  let { startAfter, endBefore = "" } = req.query;
  if (!startAfter) {
    startAfter = new Date(0).toString();
  }
  if (typeof startAfter === "string" && typeof endBefore === "string") {
    const result = await AnalyticsController.getEarnings(startAfter, endBefore);
    ResponseApi(res, {
      status: "OK",
      data: result
    })
  } else {
    ResponseApi(res, {
      status: "BAD_REQUEST",
      message: "invalid parameter"
    })
  }
})

router.get("/stats/sessions", async (req, res) => {
  const result = await AnalyticsController.getSessionsByCategoryAndStatus();
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.get("/stats/location", async (req, res) => {
  let { startAfter, endBefore = "" } = req.query;
  if (!startAfter) {
    startAfter = new Date(0).toString();
  }
  if (typeof startAfter === "string" && typeof endBefore === "string") {
    const result = await AnalyticsController.getUserLocations(startAfter, endBefore);
    ResponseApi(res, {
      status: "OK",
      data: result
    })
  } else {
    ResponseApi(res, {
      status: "BAD_REQUEST",
      message: "invalid parameter"
    })
  }
})

router.get("/stats/total-plans", async (req, res) => {
  let { startAfter, endBefore = "" } = req.query;
  if (!startAfter) {
    startAfter = new Date(0).toString();
  }
  if (typeof startAfter === "string" && typeof endBefore === "string") {
    const plansCount = await AnalyticsController.getPlansCount(startAfter, endBefore);
    ResponseApi(res, {
      status: "OK",
      data: plansCount
    })
  } else {
    ResponseApi(res, {
      status: "BAD_REQUEST",
      message: "invalid parameter"
    })
  }
})

router.get("/stats/max-earnings", async (req, res) => {
  let agg = [
    {
      $match: {
        "status": "succeeded"
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m", date: "$createdAt" } // Group by month
        },
        total: { $sum: "$amount" } // Calculate the total
      }
    },
    {
      $sort: { total: -1 } // Sort by total in descending order
    },
    {
      $limit: 1 // Get the document with the maximum total
    }];
  const result = await userTransactions.aggregate(agg).toArray();
  ResponseApi(res, {
    status: "OK",
    data: result[0]
  })
})
router.get("/stats/tutor-payments-total", async (req, res) => {
  let { startAfter, endBefore = "" } = req.query;
  if (!startAfter) {
    startAfter = new Date(0).toString();
  }
  if (typeof startAfter === "string" && typeof endBefore === "string") {
    const result = await AnalyticsController.getTotalPaymentToTutor(startAfter, endBefore);
    ResponseApi(res, {
      status: "OK",
      data: result
    })
  } else {
    ResponseApi(res, {
      status: "BAD_REQUEST",
      message: "invalid parameter"
    })
  }
})


const stripe = new Stripe(process.env.STRIPE_TEST_KEY!, {
  apiVersion: "2022-11-15"
});

router.get("/refunds", async (req, res) => {
  let { startAfter, endBefore = "" } = req.query;
  if (!startAfter) {
    startAfter = new Date(0).toString();
  }
  if (typeof startAfter === "string" && typeof endBefore === "string") {
    let timestamp = Number((new Date(startAfter).getTime() / 1000).toFixed(0));
    const refunds = await stripe.refunds.list({ created: { gte: timestamp } });
    ResponseApi(res, {
      status: "OK",
      data: { total: refunds.data.reduce((acc, curr) => acc += (curr.amount / 100), 0) }
    })
  } else {
    ResponseApi(res, {
      status: "BAD_REQUEST",
      message: "invalid parameter"
    })
  }
})
export default router;