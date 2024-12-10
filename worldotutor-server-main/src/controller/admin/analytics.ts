import { differenceInDays, subDays } from "date-fns";
import { classesCollection, locationStatsCollection, plansCollection, tutorsCollection, userTransactions, usersCollection } from "../../config/mongodb-config";

let match = (d: Date, e: Date) => {
  return {
    $match: {
      $and: [
        { createdAt: { $gt: d } },
        { createdAt: { $lt: e } }
      ]
    }
  }
}
let group = {
  $group: {
    _id: null,
    count: {
      $sum: 1,
    },
  },
}
let project = {
  $project: {
    _id: 0,
  }
}
async function getPlansCount(startAfter: string, endBefore: string) {
  let d = new Date(startAfter);
  let e = new Date(endBefore || new Date().toString());
  const result = await plansCollection.aggregate([
    match(d, e),
    group,
    project
  ]).toArray()
  if (endBefore) {
    let diff = differenceInDays(d, e)
    let d2 = subDays(d, diff);
    let e2 = subDays(e, diff);
    const result2 = await plansCollection.aggregate([
      match(d2, e2),
      group,
      project
    ]).toArray()
    return { ...result[0], previousCount: result2[0] ? result2[0].count : 0 }
  } else {
    return { ...result[0], previousCount: 0 }
  }
}

async function getStudentsCount(startAfter: string, endBefore: string) {
  let d = new Date(startAfter);
  let e = new Date(endBefore || new Date().toString());
  let diff = differenceInDays(d, e)
  let d2 = subDays(d, diff);
  let e2 = subDays(e, diff);
  const result = await usersCollection.aggregate([
    match(d, e),
    group,
    project
  ]).toArray()
  if (endBefore) {
    let diff = differenceInDays(d, e)
    let d2 = subDays(d, diff);
    let e2 = subDays(e, diff);
    const result2 = await usersCollection.aggregate([
      match(d2, e2),
      group,
      project
    ]).toArray()
    return { ...result[0], previousCount: result2[0] ? result2[0].count : 0 }
  } else {
    return { ...result[0], previousCount: 0 }
  }
}

async function getTutorsCount(startAfter: string, endBefore: string) {
  let d = new Date(startAfter);
  let e = new Date(endBefore || new Date().toString());
  let diff = differenceInDays(d, e)
  let d2 = subDays(d, diff);
  let e2 = subDays(e, diff);
  const result = await tutorsCollection.aggregate([
    match(d, e),
    group,
    project
  ]).toArray()
  if (endBefore) {
    let diff = differenceInDays(d, e)
    let d2 = subDays(d, diff);
    let e2 = subDays(e, diff);
    const result2 = await tutorsCollection.aggregate([
      match(d2, e2),
      group,
      project
    ]).toArray()
    return { ...result[0], previousCount: result2[0] ? result2[0].count : 0 }
  } else {
    return { ...result[0], previousCount: 0 }
  }
}

async function getClassesCount(startAfter: string, endBefore: string) {
  let d = new Date(startAfter);
  let e = new Date(endBefore || new Date().toString());
  let diff = differenceInDays(d, e)
  let d2 = subDays(d, diff);
  let e2 = subDays(e, diff);
  const result = await classesCollection.aggregate([
    match(d, e),
    group,
    project
  ]).toArray()
  if (endBefore) {
    let diff = differenceInDays(d, e)
    let d2 = subDays(d, diff);
    let e2 = subDays(e, diff);
    const result2 = await classesCollection.aggregate([
      match(d2, e2),
      group,
      project
    ]).toArray()
    return { ...result[0], previousCount: result2[0] ? result2[0].count : 0 }
  } else {
    return { ...result[0], previousCount: 0 }
  }
}

async function getEarnings(startAfter: string, endBefore: string) {
  let d = new Date(startAfter);
  let e = new Date(endBefore || new Date().toString());
  return await userTransactions.aggregate([
    {
      $match: {
        $and: [
          { createdAt: { $gt: d } },
          { createdAt: { $lt: e } }
        ],
        "status": "succeeded"
      }
    },
    {
      $group: {
        _id: {
          $add: [
            {
              $dayOfYear: "$createdAt",
            },
            {
              $multiply: [
                400,
                {
                  $year: "$createdAt",
                },
              ],
            },
          ],
        },
        total: {
          $sum: "$amount",
        },
        date: {
          $min: "$createdAt",
        },
      },
    },
    {
      $sort: {
        date: -1,
      },
    },
  ]).toArray()
}

export async function getSessionsByCategoryAndStatus() {
  let agg = [
    {
      $group: {
        _id: {
          status: "$status",
          categoryType: "$categoryType",
        },
        count: {
          $sum: 1,
        },
      },
    },
    {
      $group: {
        _id: "$_id.categoryType",
        statuses: {
          $push: {
            status: "$_id.status",
            count: "$count",
          },
        },
      },
    },
  ]
  const result = await classesCollection.aggregate(agg).toArray();
  return result
}

export async function getUserLocations(startAfter: string, endBefore: string) {
  let d = new Date(startAfter);
  let e = new Date(endBefore || new Date().toString());
  let agg = [
    {
      $match: {
        $and: [
          { createdAt: { $gt: d } },
          { createdAt: { $lt: e } }
        ],
      }
    },
    {
      $group: {
        _id: {
          role: "$role",
          country: "$country",
        },
        count: {
          $sum: 1,
        },
      },
    },
    {
      $group: {
        _id: "$_id.role",
        countries: {
          $push: {
            country: "$_id.country",
            count: "$count",
          },
        },
      },
    },
  ]
  const result = await locationStatsCollection.aggregate(agg).toArray();
  return result
}

export async function getStudentsLocation(startAfter: string, endBefore: string) {
  let d = new Date(startAfter);
  let e = new Date(endBefore || new Date().toString());
  const studentsLocation = await locationStatsCollection.aggregate([
    {
      $match: {
        $and: [
          { createdAt: { $gt: d } },
          { createdAt: { $lt: e } }
        ],
        role: "student"
      }
    },
    group,
    project
  ]).toArray()
  return {
    students: studentsLocation,
  }
}

export async function getTutorsLocation(startAfter: string, endBefore: string) {
  let d = new Date(startAfter);
  let e = new Date(endBefore || new Date().toString());
  const tutorsLocation = await locationStatsCollection.aggregate([
    {
      $match: {
        $and: [
          { createdAt: { $gt: d } },
          { createdAt: { $lt: e } }
        ],
        role: "tutor"
      }
    },
    group,
    project
  ]).toArray()
  return {
    tutors: tutorsLocation
  }
}

export async function getTotalPaymentToTutor(startAfter: string, endBefore: string) { 
  let d = new Date(startAfter);
  let e = new Date(endBefore || new Date().toString());
  const result = await classesCollection.aggregate([
    {
      $match: {
        $and: [
          { createdAt: { $gt: d } },
          { createdAt: { $lt: e } }
        ],
        type: "plan",
        status: "completed"
      }
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$tutorPayment"
        }
      }
    }
  ]).toArray();
  return result[0]
}

async function addUserLocation(body: any) {
  const doc = locationStatsCollection.findOne({ userId: body.userId });
  if (!doc) {
    return await locationStatsCollection.insertOne({ ...body, createdAt: new Date() });
  } else {
    return;
  }
}

const AnalyticsController = {
  getPlansCount,
  getClassesCount,
  getEarnings,
  getStudentsCount,
  getTutorsCount,
  getSessionsByCategoryAndStatus,
  getStudentsLocation,
  getTutorsLocation,
  getUserLocations,
  getTotalPaymentToTutor,
  addUserLocation

}
export default AnalyticsController