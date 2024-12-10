import express from 'express';
import { ObjectId } from "mongodb";
import { bucket, client } from "../../config/mongodb-config";
import multer from "multer";
import { GridFsStorage } from "multer-gridfs-storage";
import TutorRequestsController from '../../controller/tutor-requests';
import { ResponseApi } from '../../core/response';
require("dotenv").config();

const router = express.Router();

const filters = ["status", "categoryType", "level"];
const sortBy = ["createdAt"];

const getFilters = (query: any) => {
  let q: { [x: string]: any } = {};
  Object.keys(query).forEach((key) => {
    if (filters.includes(key)) {
      if (!query[key]) return;
      if (key === "status") {
        q["status"] = query[key]
        return;
      }
      if (key === "categoryType") {
        q["profession.data.categoryType"] = query[key];
        return;
      }
      if (key === "level") {
        q["agreement.level"] = query[key];
        return;
      }
      q[key] = query[key];
    }
  })
  return q;
}

const getSorting = (query: any) => {
  let q: { [x: string]: any } = {};
  Object.keys(query).forEach((key) => {
    if (sortBy.includes(key)) {
      if (key === "createdAt") {
        q["createdAt"] = Number(query[key])
        return;
      }
      q[key] = Number(query[key])
    }
  })
  return q;
}


// Get By Account Id
router.get("/tutor-request", async (req, res) => {
  const { id } = req.query;
  if (typeof id === "string") {
    const result = await TutorRequestsController.getByAccountId(id);
    ResponseApi(res, {
      status: "OK",
      data: result
    })
  }
})

// Get By Doc Id
router.get('/tutor-request/:tutor_id', async (req, res, next) => {
  const result = await TutorRequestsController.getById(req.params.tutor_id);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})


// Get By any filters
router.get('/tutor-requests', async (req, res, next) => {
  const filters = getFilters(req.query);
  const sortBy = getSorting(req.query);
  const { resultsPerPage, page } = req.query
  if (Number(page) <= 0 || Number(resultsPerPage) <= 0) {
    ResponseApi(res, {
      status: "BAD_REQUEST",
      message: "Invalid Parameter"
    })
    return;
  }
  const result = await TutorRequestsController.getAll(filters, sortBy, Number(resultsPerPage), Number(page));
  ResponseApi(res, {
    status: "OK",
    data: { ...result }
  })
})

// Updates from tutor
router.post("/profile-setup", async (req, res) => {
  const result = await TutorRequestsController.updateByAccountId(req.body);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.post("/accept-agreement", async (req, res) => {
  const result = await TutorRequestsController.acceptAgreement(req.body)
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})


// Updates from admin
// TODO: To find and update doc :- send id of doc in route OR create a id and _id fields in each doc
router.put('/tutor-requests', async (req, res, next) => {
  const result = await TutorRequestsController.update(req.body);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.put("/tutor-agreement", async (req, res) => {
  const result = await TutorRequestsController.updateAgreement(req.body)
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})


const storage = new GridFsStorage({
  url: process.env.MONGO_CLOUD_URI!,
  db: client.db("wot"),
  //@ts-ignore
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = file.originalname;
      const fileInfo = {
        filename: filename,
        bucketName: "files"
      };
      resolve(fileInfo);
    });
  }
});

const upload = multer({ storage });

router.get("/fileinfo/:_id", async (req, res) => {
  let x = ObjectId.isValid(req.params._id);
  if (!x) {
    res.send("Invalid File")
    return;
  }
  const cursor = await bucket.find({ _id: new ObjectId(req.params._id) }).toArray();
  if (cursor.length === 0) {
    res.send("No File Exists")
    return;
  }
  try {
    bucket.openDownloadStreamByName(cursor[0].filename).pipe(res);
  } catch (error) {
    console.log(error);
  }
});

router.post("/upload", upload.array("files"), (req, res) => {
  const ids: string[] = []
  // @ts-ignore
  req.files?.forEach((file) => ids.push(file.id))
  res.status(200)
    .json({
      "ids": ids,
      "message": "File uploaded successfully"
    });
});

// router.post('/singleFile', upload.single('file'), ProfileSetup.singleFileUpload)

export default router;

