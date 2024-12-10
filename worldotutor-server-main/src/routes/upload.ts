import express from 'express';

import { Storage } from "@google-cloud/storage"
import multer from 'multer';
import { ResponseApi } from '../core/response';

const router = express.Router();
let projectId = process.env.GOOGLE_PROJECT_ID;
let keyFilename = "key.json";

const storage = new Storage({
  projectId,
  keyFilename
})
const bucket = storage.bucket(process.env.GOOGLE_STORAGE_BUCKET!);

const upload = multer({
  storage: multer.memoryStorage()
})

router.post("/upload", upload.single("file"), async (req, res) => {
    try {
    if (req.file) {
      const blob = bucket.file(req.file.originalname)
      const blobStream = blob.createWriteStream();
      blobStream.on("finish", () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`
        console.log(publicUrl)
        ResponseApi(res, {
          status: "OK",
          data: publicUrl
        })
      })
      blobStream.end(req.file.buffer);
    }
  } catch (err) {
    console.log(err)
  }
})

export default router;