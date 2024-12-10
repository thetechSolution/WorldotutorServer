import Express from 'express';
import { getQueryParams } from '../../utils/functions';
import ClassesController from '../../controller/tutor/classes';
import { ResponseApi } from '../../core/response';
import TutorPlanController from '../../controller/tutor/plans';

const router = Express.Router();

router.get("/:tutorId/sessions", async (req, res) => {
    const filters = getQueryParams(req.query);
    const result = await ClassesController.getByTutorId(req.params.tutorId, filters);
    ResponseApi(res, {
        status: "OK",
        data: result
    })
})

router.get("/:tutorId/attendance", async (req, res) => {
    const result = await TutorPlanController.getPlansAttendance(req.params.tutorId);
    ResponseApi(res, {
        status: "OK",
        data: result
    })
})
router.get("/:tutorId/plans/:planId/attendance", async (req, res) => {
    const result = await TutorPlanController.getPlanAttendance(req.params.planId);
    ResponseApi(res, {
        status: "OK",
        data: result
    })
})

export default router;