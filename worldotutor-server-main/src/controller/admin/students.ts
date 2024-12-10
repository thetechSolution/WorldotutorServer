import { usersCollection } from "../../config/mongodb-config";

async function getAllStudents(filters: any, sortBy: any, resultsPerPage: number, page: number) {
  const data = await usersCollection.aggregate([{
    $match: {
      ...filters,
    }
  },
  { $sort: sortBy ? sortBy : { createdAt: -1 } },
  { $skip: (page - 1) * resultsPerPage || 0 },
  { $limit: resultsPerPage || 5 }
  ]).toArray();
  const count = await usersCollection.countDocuments(filters);
  return {
    data,
    count
  }
}
const AStudentController = {
  getAllStudents
}
export default AStudentController;