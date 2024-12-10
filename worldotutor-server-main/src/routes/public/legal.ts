import express from 'express';
import Legal from '../../controller/admin/legal';
import { ResponseApi } from '../../core/response';

const router = express.Router();

router.get("/legal", async (req, res) => {
  const { type } = req.query;
  const result = await Legal.getOfType(type);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

export default router;
