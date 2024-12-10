import Express from 'express';
import TutorController from '../../controller/tutor';
import { ResponseApi } from '../../core/response';

const router = Express();

// Get By Account Id
router.get("/profile", async (req, res) => {
  const { id } = req.query;
  if (typeof id === "string") {
    const result = await TutorController.getByAccountId(id);
    ResponseApi(res, {
      status: "OK",
      data: result
    })
  }
})

router.put("/calender", async (req, res) => {
  const result = await TutorController.updateCalender(req.body);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.put("/profile", async (req, res) => {
  const result = await TutorController.updateProfile(req.body);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.put("/update-agreement", async (req, res) => {
  const result = await TutorController.updateAgreement(req.body);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

export default router;