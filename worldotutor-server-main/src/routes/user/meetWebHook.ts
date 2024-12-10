import express from 'express';
const crypto = require('crypto')

const router = express.Router();

const ZOOM_WEBHOOK_SECRET_TOKEN = "0O_CfvajTniHeMEDqQ6Qeg"
// @ts-ignore
router.post('/zoom-webhook', express.raw({ "verify": (req, res, bug) => req.rawBody = bug.toString() }), async (request, response) => {
  // Webhook request event type is a challenge-response check
  if (request.body.event === 'endpoint.url_validation') {
    const hashForValidate = crypto.createHmac('sha256', ZOOM_WEBHOOK_SECRET_TOKEN).update(request.body.payload.plainToken).digest('hex')
    const signature = `v0=${hashForValidate}`
    if (request.headers['x-zm-signature'] === signature) {
      // Webhook request came from Zoom   
    } else {
      // Webhook request did not come from Zoom
    }
    response.status(200)
    response.json({
      "plainToken": request.body.payload.plainToken,
      "encryptedToken": hashForValidate
    })
  }
  // console.log(request.body);
  // if (request.body.event === 'meeting.ended') {
  //   const meetId = request.body.payload.object.id;
  //   console.log(meetId);
  //   const session = await classesCollection.findOne({ "meeting.id": meetId });
  //   console.log(session);
  //   if (!session) return;
  //   await BookTrialController.update(session._id.toString(), {
  //     status: "completed",
  //   })
  // }
})

export default router;