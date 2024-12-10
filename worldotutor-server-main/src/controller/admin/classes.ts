import { ObjectId } from "mongodb";
import { classesCollection } from "../../config/mongodb-config";
import { lookupTutorFromSession, lookupUserFromSession } from "../user/session";

async function getAllClasses(filters: any, sortBy: any, resultsPerPage: number, page: number) {
  const data = await classesCollection.aggregate([
    {
      $match: {
        ...filters,
      }
    },
    ...lookupTutorFromSession,
    ...lookupUserFromSession,
    { $sort: sortBy ? sortBy : { createdAt: -1 } },
    { $skip: (page - 1) * resultsPerPage || 0 },
    { $limit: resultsPerPage || 5 }
  ]).toArray();
  const count = await classesCollection.countDocuments(filters);
  return {
    data,
    count
  }
}


async function getAllClassesDisputes(filters: any, sortBy: any, resultsPerPage: number, page: number) {
  const data = await classesCollection.aggregate([
    {
      $match: {
        ...filters,
        "dispute": { $exists: true }
      }
    },
    ...lookupTutorFromSession,
    ...lookupUserFromSession,
    { $sort: sortBy ? sortBy : { createdAt: -1 } },
    { $skip: (page - 1) * resultsPerPage || 0 },
    { $limit: resultsPerPage || 5 }
  ]).toArray();
  const count = await classesCollection.countDocuments({ ...filters, "dispute": { $exists: true } });
  return {
    data,
    count
  }
}

async function getClassById(id: string) {
  const result = await classesCollection.aggregate([
    {
      $match: {
        _id: new ObjectId(id)
      }
    },
    ...lookupUserFromSession,
    ...lookupTutorFromSession
  ]).toArray();
  return result[0];
}

async function getFacetsByCategoryName() {
  return await classesCollection.aggregate([
    {
      $facet: {
        categorizebyCategoryName: [
          {
            $unwind: "$category.name",
          },
          {
            $sortByCount: "$category.name",
          },
        ],
      }
    }
  ]).toArray();
}

const ClassesController = {
  getAllClasses,
  getAllClassesDisputes,
  getClassById,
  getFacetsByCategoryName
}

export default ClassesController