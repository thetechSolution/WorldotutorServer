import { ObjectId } from "mongodb";
import { tutorsCollection, userRequirementCol } from "../../config/mongodb-config";

//add requirement
async function add(body: any) {
  const result = await userRequirementCol.insertOne({
    ...body,
    completed: false,
    createdAt: new Date(),
  });
  return { _id: result.insertedId, ...body };
}

//get all requirements by userId
async function getByUserId(userId: string) {
  const filter = [
    {
      $match: {
        userId: userId,
      },
    },
    {
      $lookup: {
        from: "tutors",
        let: {
          categoryType: "$categoryType",
          categoryList: "$categoryList",
          category: "$category",
          subject: "$subject",
          grade: "$grade",
          board: "$board",
          type: "$type",
          level: "$level",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $and: [
                      {
                        $eq: ["$agreement.level", "$$category"],
                      },
                      {
                        $eq: [
                          "$profession.data.categoryType",
                          "$$categoryType",
                        ],
                      },
                    ]
                  },
                  {

                    $or: [
                      {
                        //subject
                        $or: [
                          {
                            $eq: ["$agreement.level", "$$category"],
                          },
                          {
                            $eq: [
                              "$profession.data.categoryType",
                              "$$categoryType",
                            ],
                          },
                          {
                            $setIsSubset: [
                              "$$categoryList",
                              "$profession.data.categories.name",
                            ],
                          },
                          {
                            $gte: [
                              {
                                $size: {
                                  $filter: {
                                    input:
                                      "$profession.data.categories.board.grades",
                                    as: "grades",
                                    cond: {
                                      $in: ["$$grade", "$$grades"],
                                    },
                                  },
                                },
                              },
                              0,
                            ],
                          },
                          {
                            $gte: [
                              {
                                $size: {
                                  $filter: {
                                    input: "$profession.data.categories.board.name",
                                    as: "boards",
                                    cond: {
                                      $in: ["$$board", "$$boards"],
                                    },
                                  },
                                },
                              },
                              0,
                            ],
                          },
                          { $eq: ["$status", "active"] },
                        ],
                      },
                      {
                        //hobby & skill
                        $or: [
                          {
                            $eq: ["$agreement.level", "$$category"],
                          },
                          {
                            $eq: [
                              "$profession.data.categoryType",
                              "$$categoryType",
                            ],
                          },
                          {
                            $setIsSubset: [
                              "$$categoryList",
                              "$profession.data.categories.name",
                            ],
                          },
                          {
                            $gte: [
                              {
                                $size: {
                                  $filter: {
                                    input: "$profession.data.categories.types",
                                    as: "types",
                                    cond: {
                                      $in: ["$$type", "$$types.name"],
                                    },
                                  },
                                },
                              },
                              0,
                            ],
                          },
                          {
                            $gte: [
                              {
                                $size: {
                                  $filter: {
                                    input: "$profession.data.categories.types",
                                    as: "types",
                                    cond: {
                                      $in: [["$$level"], "$$types.levels"],
                                    },
                                  },
                                },
                              },
                              0,
                            ],
                          },
                          { $eq: ["$status", "active"] },
                        ],
                      },
                    ],
                  }
                ],


              },
            },
          },
          // {
          //   $project: {
          //     personal: 1,
          //     agreement: 1,
          //     profession: 1,
          //   },
          // },
        ],

        as: "suggestedTutors",
      },
    },
    { $sort: { createdAt: 1 } }
  ];

  const doc = await userRequirementCol.aggregate(filter).toArray();
  return doc;
}

// mark requirement as complete
async function update(id: string, body: any) {
  let filter = { _id: new ObjectId(id) };
  await userRequirementCol.updateOne(filter, {
    $set: {
      ...body,
      updatedAt: new Date(),
    },
  });
  const document = await userRequirementCol.findOne(filter);
  return document;
}

//delete requirement
async function remove(_id: string) {
  let filter = { _id: new ObjectId(_id) };
  const result = await userRequirementCol.deleteOne(filter);
  return result;
}

const UserRequirementController = {
  add,
  getByUserId,
  update,
  remove,
};

export default UserRequirementController;
