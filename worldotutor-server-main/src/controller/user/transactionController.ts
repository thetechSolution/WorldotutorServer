import { ObjectId } from "mongodb";
import { userTransactions } from "../../config/mongodb-config";

async function get(userId: any) {
  const result = await userTransactions.aggregate([
    {
      $match: {
        $expr: {
          $and: [{
            $eq: [
              "$user._id",
              new ObjectId(userId),
            ],
          },
          { $ne: ["$status", "created"] }
          ],
        },
      },
    },
    {
      $lookup: {
        from: "plans",
        let: {
          planId: "$planId",
        },
        as: "plan",
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  "$_id",
                  {
                    $toObjectId: "$$planId",
                  },
                ],
              },
            },
          },
          {
            $project: {
              userId: 1,
              trainerId: 1,
              purchasedSessions: 1,
              // course: 1,
              // courseType: 1,
              // level: 1,
              category: 1,
              amount: 1,
              discount: 1,
              totalCost: 1,
            },
          },
        ],
      },
    },
    {
      $set: {
        plan: {
          $arrayElemAt: ["$plan", 0],
        },
      },
    },
    {
      $lookup: {
        from: "users",
        let: {
          userId: {
            $toObjectId: "$plan.userId",
          },
        },
        as: "plan.user",
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
              name: 1,
              profilePic: 1,
              email: 1,
              phoneNumber: 1,
            },
          },
          {
            $limit: 1,
          },
        ],
      },
    },
    {
      $lookup: {
        from: "tutors",
        let: {
          tutorId: {
            $toObjectId: "$plan.tutorId",
          },
        },
        as: "plan.tutor",
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$tutorId"],
              },
            },
          },
          {
            $project: {
              personal: {
                name: 1,
                profilePic: 1,
              },
            },
          },
          {
            $limit: 1,
          },
        ],
      },
    },
    {
      $set: {
        "plan.user": {
          $first: "$plan.user",
        },
        "plan.tutor": {
          $first: "$plan.tutor",
        },
      },
    },
  ]).toArray()
  return result;
}

const UserTransaction = {
  get
}

export default UserTransaction