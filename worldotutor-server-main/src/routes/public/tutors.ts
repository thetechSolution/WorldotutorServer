import express from 'express';
import TutorController from '../../controller/tutor';
import { ResponseApi } from '../../core/response';
import asyncHandler from 'express-async-handler';
import { tutorsCollection } from '../../config/mongodb-config';
import { isBefore } from "date-fns";

const router = express.Router();

router.get("/tutors/:tutor_id", asyncHandler(async (req, res, next) => {
  const result = await TutorController.getById(req.params.tutor_id);
  ResponseApi(res, {
    status: "OK",
    data: result,
  });
}));

// Get By any filters
router.get("/tutors", asyncHandler(async (req, res, next) => {
  const { status } = req.query;
  if (typeof status === "string" || !status) {
    const result = await TutorController.getAll(status);
    ResponseApi(res, {
      status: "OK",
      data: result,
    });
  }
}));

const filters = [
  "category",
  "categoryName",
  "categoryTypeName",
  "levels",
  "grades",
  "boards",
  "quality",
];

const getFilters = (query: any) => {
  let q = {};
  Object.keys(query).forEach((key) => {
    if (filters.includes(key)) {
      if (key === "category") {
        key = "profession.data.categoryType";
        // @ts-ignore
        q[key] = query["category"];
      } else if (key === "categoryName") {
        key = "profession.data.categories.name"; // @ts-ignore
        q[key] = { $in: query["categoryName"] };
      } else if (key === "grades") {
        key = "profession.data.categories.board.grades"; // @ts-ignore
        q[key] = { $in: query["grades"] };
      } else if (key === "boards") {
        key = "profession.data.categories.board.name"; // @ts-ignore
        q[key] = { $in: query["boards"] };
      } else if (key === "categoryTypeName") {
        key = "profession.data.categories.types.name"; // @ts-ignore
        q[key] = { $in: query["categoryTypeName"] };
      } else if (key === "levels") {
        key = "profession.data.categories.types.levels"; // @ts-ignore
        //change to $all if needed
        q[key] = { $in: query["levels"] };
      } else if (key === "quality") {
        key = "agreement.level"; // @ts-ignore
        q[key] = query["quality"];
      } else {
        // @ts-ignore
        q[key] = query[key];
      }
    }
  });
  console.log(q);
  return q;
};

router.post("/tutors-page", asyncHandler(async (req, res) => {
  const filters = getFilters(req.body);
  const result = await TutorController.getFilteredTutors(
    filters,
    req.body.page,
    req.body.resultsPerPage
  );
  ResponseApi(res, {
    status: "OK",
    data: {
      count: result.count,
      results: result.data,
    },
  });
}));

router.post("/delete-tutor-slots", async (req, res) => {
  const tutors = await tutorsCollection.find().toArray();
  if (tutors.length > 0)
    for (const tutor of tutors) {
      if (tutor.calender) {
        let today = new Date()
        today.setHours(0, 0, 0);
        const updatedSlots = tutor.calender.filter((slot: any) => !isBefore(new Date(slot.start), today))
        await tutorsCollection.updateOne({ _id: tutor._id }, {
          $set: {
            "calender": updatedSlots
          }
        })
      }
    }
  res.send("Success").status(200);
})


export default router;