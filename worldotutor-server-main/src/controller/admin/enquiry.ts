import { ObjectId } from "mongodb";
import { enquiriesCollection } from "../../config/mongodb-config";

async function get(filters: any, sortBy: any, page: any, resultsPerPage: any) {
  const data = await enquiriesCollection.aggregate([
    { $match: { ...filters } },
    { $sort: sortBy ? sortBy : { createdAt: -1 } },
    { $skip: (page - 1) * resultsPerPage || 0 },
    { $limit: resultsPerPage || 5 }
  ]).toArray();
  const count = await enquiriesCollection.countDocuments(filters);
  return {
    data,
    count
  }
}

async function getById(id: string) {
  const result = await enquiriesCollection.findOne({ _id: new ObjectId(id) });
  return result;
}

async function add(data: any) {
  const enquiry = {
    ...data,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const result = enquiriesCollection.insertOne({ ...enquiry });
  return result;
}

async function updateStatus(id: string, action: string) {
  const enquiry = {
    status: action,
    updatedAt: new Date()
  }
  const filter = { _id: new ObjectId(id) };
  const result = enquiriesCollection.updateOne(filter, {
    $set: { ...enquiry }
  });
  return result;
}

const EnquiryController = {
  add,
  get,
  getById,
  updateStatus
}

export default EnquiryController