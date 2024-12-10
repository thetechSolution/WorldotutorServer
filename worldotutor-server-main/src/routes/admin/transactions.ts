import Express from 'express';
import { userTransactions } from '../../config/mongodb-config';
import { ResponseApi } from '../../core/response';
import AdminTransactions from '../../controller/admin/transactions';
const router = Express.Router();

const filters = ["status", "modeOfPayment"]
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
      if (key === "modeOfPayment") {
        q["modeOfPayment"] = query[key]
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
      if (key === "createdAt") {
        q["createdAt"] = Number(query[key])
      }
      q[key] = Number(query[key])
    }
  })
  return q;
}

router.get("/user-transactions", async (req, res) => {
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
  const result = await AdminTransactions.geUserTransactions(filters, sortBy, Number(resultsPerPage), Number(page));
  ResponseApi(res, {
    status: "OK",
    data: {
      results: result.data,
      count: result.count
    }
  })
})


export default router;