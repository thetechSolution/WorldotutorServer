import express from 'express';
import { ResponseApi } from '../../core/response';
import Legal from '../../controller/admin/legal';

const router = express.Router();

router.post("/legal", async (req, res) => {
  const data = req.body;
  const result = await Legal.insert(data);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.put("/legal", async (req, res) => {
  const data = req.body;
  const result = await Legal.update(data);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

export default router;
