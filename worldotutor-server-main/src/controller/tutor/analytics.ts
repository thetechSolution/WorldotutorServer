import { differenceInDays, subDays } from "date-fns";

import { classesCollection, plansCollection } from "../../config/mongodb-config";

let matchCreatedAtWithTutorId = (d: Date, e: Date, tutorId: string) => {
  return {
    $match: {
      tutorId: tutorId,
      $and: [
        { "createdAt": { $gt: d } },
        { "createdAt": { $lt: e } }
      ]
    }
  }
}

let matchScheduledTimeWithTutorId = (d: Date, e: Date, tutorId: string) => {
  return {
    $match: {
      tutorId: tutorId,
      $and: [
        { "scheduledTime.start": { $gt: d } },
        { "scheduledTime.end": { $lt: e } }
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

async function getSessionsCount(tutorId: string, startAfter: string, endBefore: string) {
  let d = new Date(startAfter);
  let e = new Date(endBefore || new Date().toString());
  const result = await classesCollection.aggregate([
    matchCreatedAtWithTutorId(d, e, tutorId),
    group,
    project
  ]).toArray()
  if (endBefore) {
    let diff = differenceInDays(d, e)
    let d2 = subDays(d, diff);
    let e2 = subDays(e, diff);
    const result2 = await classesCollection.aggregate([
      matchCreatedAtWithTutorId(d2, e2, tutorId),
      group,
      project
    ]).toArray()
    return { ...result[0], previousCount: result2[0] ? result2[0].count : 0 }
  } else {
    return { ...result[0], previousCount: 0 }
  }
}

async function getEarnings(tutorId: string, startAfter: string, endBefore: string) {
  let d = new Date(startAfter);
  let e = new Date(endBefore || new Date().toString());
  const result = await classesCollection.aggregate([
    {
      $match: {
        $and: [
          { "scheduledTime.start": { $gt: d } },
          { "scheduledTime.end": { $lt: e } }
        ],
        tutorId: tutorId,
        status: "completed",
        "attendance.tutor": "present"
      }
    },
    {
      $group: {
        _id: {
          $add: [
            {
              $dayOfYear: "$scheduledTime.start",
            },
            {
              $multiply: [
                400,
                {
                  $year: "$scheduledTime.start",
                },
              ],
            },
          ],
        },
        total: {
          $sum: "$tutorPayment",
        },
        date: {
          $min: "$scheduledTime.start",
        },
      },
    },
    {
      $sort: {
        date: -1,
      },
    },
  ]).toArray()
  return result;
}

async function getEstimatedEarnings(tutorId: string, startAfter: string, endBefore: string) {
  let d = new Date(startAfter);
  let e = new Date(endBefore || new Date().toString());
  const result = await classesCollection.aggregate([
    {
      $match: {
        $and: [
          { createdAt: { $gt: d } },
          { createdAt: { $lt: e } }
        ],
        tutorId: tutorId,
        $or: [{ status: "upcoming" }, { status: "completed" }]
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
          $sum: "$tutorPayment",
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
  return result;
}

async function getMaxEarnings(tutorId: string) {
  let agg = [
    {
      $match: {
        tutorId: tutorId,
        "status": "completed",
        "attendance.tutor": "present"
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m", date: "$scheduledTime.start" } // Group by month
        },
        total: { $sum: "$tutorPayment" } // Calculate the total
      }
    },
    {
      $sort: { total: -1 } // Sort by total in descending order
    },
    {
      $limit: 1 // Get the document with the maximum total
    }];
  const result = await classesCollection.aggregate(agg).toArray();
  return result[0];
}

async function getDeductions(tutorId: string, startAfter: string, endBefore: string) {
  let d = new Date(startAfter);
  let e = new Date(endBefore || new Date().toString());
  const result = await classesCollection.aggregate([
    {
      $match: {
        $and: [
          { "scheduledTime.start": { $gt: d } },
          { "scheduledTime.end": { $lt: e } }
        ],
        tutorId: tutorId,
        "attendance.tutor": "absent"
      }
    },
    {
      $group: {
        _id: {
          $add: [
            {
              $dayOfYear: "$scheduledTime.start",
            },
            {
              $multiply: [
                400,
                {
                  $year: "$scheduledTime.start",
                },
              ],
            },
          ],
        },
        total: {
          $sum: "$tutorPayment",
        },
        date: {
          $min: "$scheduledTime.start",
        },
      },
    },
    {
      $sort: {
        date: -1,
      },
    },
  ]).toArray()
  return result;
}


async function getPlansCount(tutorId: string, startAfter: string, endBefore: string) {
  let d = new Date(startAfter);
  let e = new Date(endBefore || new Date().toString());
  const result = await plansCollection.aggregate([
    matchCreatedAtWithTutorId(d, e, tutorId),
    group,
    project
  ]).toArray()
  if (endBefore) {
    let diff = differenceInDays(d, e)
    let d2 = subDays(d, diff);
    let e2 = subDays(e, diff);
    const result2 = await plansCollection.aggregate([
      matchCreatedAtWithTutorId(d2, e2, tutorId),
      group,
      project
    ]).toArray()
    return { ...result[0], previousCount: result2[0] ? result2[0].count : 0 }
  } else {
    return { ...result[0], previousCount: 0 }
  }
}

async function getStudentsCount(tutorId: string, startAfter: string, endBefore: string) {
  let d = new Date(startAfter);
  let e = new Date(endBefore || new Date().toString());
  // const result = await plansCollection.aggregate([
  //   matchWithTutorId(d, e, tutorId),
  //   group,
  //   project
  // ]).toArray()
  // if (endBefore) {
  //   let diff = differenceInDays(d, e)
  //   let d2 = subDays(d, diff);
  //   let e2 = subDays(e, diff);
  //   const result2 = await plansCollection.aggregate([
  //     matchWithTutorId(d2, e2, tutorId),
  //     group,
  //     project
  //   ]).toArray()
  //   return { ...result[0], previousCount: result2[0] ? result2[0].count : 0 }
  // } else {
  //   return { ...result[0], previousCount: 0 }
  // }

  const result = await plansCollection.aggregate(
    [
      matchCreatedAtWithTutorId(d, e, tutorId),
      {
        $lookup: {
          from: "users",
          let: {
            userId: {
              $toObjectId: "$userId",
            },
          },
          as: "user",
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$userId"],
                },
              },
            },
            {
              $project: {
                prefrences: 0,
              },
            },
            {
              $limit: 1,
            },
          ],
        },
      },
      {
        $group: {
          _id: "$userId",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ]
  ).toArray();

  return { count: result.length, previousCount: 0 }
}



const TutorAnalytics = {
  getSessionsCount,
  getEarnings,
  getEstimatedEarnings,
  getMaxEarnings,
  getDeductions,
  getPlansCount,
  getStudentsCount

}

export default TutorAnalytics;