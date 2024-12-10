import { userTransactions } from "../../config/mongodb-config"

export async function geUserTransactions(filters: any, sortBy: any, resultsPerPage: number, page: number) {
  const data = await userTransactions.aggregate([
    { $match: { ...filters, } },
    { $sort: sortBy ? sortBy : { createdAt: -1 } },
    { $skip: (page - 1) * resultsPerPage || 0 },
    { $limit: resultsPerPage || 5 }
  ]).toArray();
  const count = await userTransactions.countDocuments(filters);
  return {
    data,
    count
  }
}

const AdminTransactions = {
  geUserTransactions
}

export default AdminTransactions