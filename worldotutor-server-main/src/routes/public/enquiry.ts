import express from 'express';
import { ResponseApi } from '../../core/response';
import EnquiryController from '../../controller/admin/enquiry';

const router = express.Router();

router.post("/enquiries", async (req, res) => {
  const result = await EnquiryController.add(req.body);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

export default router;
