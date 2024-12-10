import { ObjectId } from "mongodb";
import {
  tutorsCollection,
  recentlyViewedTutorsCol,
  tutorRequestsCol,
} from "../config/mongodb-config";
import sgMail from "@sendgrid/mail";

async function getAll(status?: string) {
  let filter = {};
  if (status) {
    filter = { status: status };
  }
  const result = await tutorsCollection
    .find(filter, { sort: { createdAt: 1 } })
    .toArray();
  return result;
}

async function getAllPaginated(filters: any, sortBy: any, resultsPerPage: number, page: number) {
  const results = await tutorsCollection.aggregate([
    { $match: { ...filters } },
    { $sort: sortBy ? sortBy : { createdAt: -1 } },
    { $skip: (page - 1) * resultsPerPage || 0 },
    { $limit: resultsPerPage || 5 }
  ]).toArray();
  const count = await tutorsCollection.countDocuments({ ...filters });
  return {
    results,
    count: count
  }
}

// async function getFilteredTutors(filters: any) {
async function getFilteredTutors(filters: any, page: any, resultsPerPage: any) {
  // let filter = {};
  // if (status) {
  //   filter = { status: status };
  // }
  const data = await tutorsCollection
    .aggregate([
      {
        $match: {
          ...filters,
          // status: 'active',
        },
      },
      {
        $sort: {
          createdAt: 1,
        },
      },
      { $skip: (page - 1) * resultsPerPage },
      { $limit: resultsPerPage },
    ])
    .toArray();
  const count = await tutorsCollection.countDocuments(filters);

  return { data, count };
}

async function getById(tutor_id: string) {
  const result = await tutorsCollection.findOne({
    _id: new ObjectId(tutor_id),
  });
  return result;
}

async function getByAccountId(id: string) {
  const result = await tutorsCollection.findOne({ account_id: id });
  return result;
}

async function updateCalender(data: any) {
  let filter = { _id: new ObjectId(data._id) };
  let update = {
    $set: {
      ...data.data,
      completed: true,
      updatedAt: new Date(),
    },
  };
  const profile = await tutorsCollection.findOneAndUpdate(filter, update);
  return profile.value;
}

async function updateProfile(data: any) {
  let filter = { _id: new ObjectId(data._id) };
  let update = {
    $set: {
      ...data.data,
      updatedAt: new Date(),
    },
  };
  const profile = await tutorsCollection.findOneAndUpdate(filter, update);
  return await tutorsCollection.findOne(filter);
}

async function updateAgreement(data: any) {
  let filter = { _id: new ObjectId(data._id) };
  const result1 = await tutorsCollection.findOne(filter);
  if (result1) {
    let update = {
      $set: {
        agreement: {
          ...result1.agreement,
          ...data.data.agreement,
          updatedAt: new Date(),
        },
        updatedAt: new Date(),
      },
    };
    const result = await tutorsCollection.findOneAndUpdate(filter, update);
    return result;
  }
}

async function acceptAgreement(data: any) {
  const filter = { _id: new ObjectId(data._id) };
  const update = {
    $set: {
      "agreement.status": "accepted",
      status: "active",
      updatedAt: new Date(),
    },
  };
  await tutorsCollection.updateOne(filter, update);
}

async function recentlyViewed(data: any) {
  const userId = data.userId;
  const filter = { userId: data.userId };
  const tutorId = new ObjectId(data.tutorId);

  const document = await recentlyViewedTutorsCol.findOne({
    userId,
  });
  if (document) {
    let recentlyViewed = document.recentlyViewed;
    recentlyViewed.push(tutorId);

    const update = { $addToSet: { recentlyViewed: tutorId } };
    const result = await recentlyViewedTutorsCol.updateOne(filter, update);
    return {
      _id: document._id,
      recentlyViewed: document.recentlyViewed,
      userId: document.userId,
    };
  } else {
    await recentlyViewedTutorsCol.insertOne({
      recentlyViewed: [tutorId],
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  const doc = await recentlyViewedTutorsCol.findOne({
    userId,
  });
  return doc;
}

async function getRecentlyViewedByUserId(id: string) {
  const filter = [
    {
      $match: {
        $expr: {
          $eq: ["$userId", id],
        },
      },
    },
    {
      $lookup: {
        from: "tutors",
        localField: "recentlyViewed",
        foreignField: "_id",
        let: {
          recentlyViewed: "$recentlyViewed",
        },
        as: "recentlyViewed",
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ["$_id", "$$recentlyViewed"],
              },
            },
          },
        ],
      },
    },
  ];
  const result = await recentlyViewedTutorsCol.aggregate(filter).toArray();
  return result;
}

async function sendIntroVideoRequest(email: string) {
  const msg = {
    to: email, // Change to your recipient
    from: "flexxitedev@gmail.com", // Change to your verified sender
    subject: "Intro Video Request",
    text: "Please provide a youtube link for your intro video",
  };
  sgMail.setApiKey(process.env.SENDGRID_KEY!);
  sgMail
    .send(msg)
    .then(async () => {
      await tutorRequestsCol.updateOne(
        { "personal.data.email": email },
        {
          $set: {
            "video.status": "requested",
            updatedAt: new Date(),
          },
        }
      );
    })
  const result = tutorRequestsCol.findOne({ "personal.data.email": email });
  return result;
}

async function addIntroVideo(body: any) {
  const ytLink = body.ytLink;
  const email = body.email;
  await tutorRequestsCol.updateOne(
    { "personal.data.email": email },
    {
      $set: {
        "video.status": "complete",
        "video.link": ytLink,
        updatedAt: new Date(),
      },
    }
  );

  const result = tutorRequestsCol.findOne({ "personal.data.email": email });
  return result;
}

const TutorController = {
  getAll,
  getAllPaginated,
  getFilteredTutors,
  getByAccountId,
  getById,
  updateCalender,
  updateProfile,
  updateAgreement,
  acceptAgreement,
  recentlyViewed,
  getRecentlyViewedByUserId,
  sendIntroVideoRequest,
  addIntroVideo,
};

export default TutorController;
