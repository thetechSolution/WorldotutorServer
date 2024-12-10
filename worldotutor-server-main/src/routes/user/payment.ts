import Express from 'express';
import asyncHandler from "express-async-handler";
import { ObjectId } from 'mongodb';
import Stripe from 'stripe';
import { draftsCollection, userTransactions, usersCollection } from '../../config/mongodb-config';
import PlansController from '../../controller/user/plan';
import UserTransaction from '../../controller/user/transactionController';
import { ResponseApi } from '../../core/response';

const router = Express.Router();

const stripe = new Stripe(process.env.STRIPE_TEST_KEY!, {
  apiVersion: "2022-11-15"
});

router.get("/transactions", (async (req, res) => {
  const { userId } = req.query;
  const result = await UserTransaction.get(userId);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
}))


router.post("/paymentInit", asyncHandler(async (req, res) => {
  const { userId, planId, amount, currency } = req.body
  const existingPlanTransaction = await userTransactions.findOne({ planId: planId, status: "created" || "requires_payment_method" });
  if (existingPlanTransaction) {
    const paymentIntent = await stripe.paymentIntents.retrieve(existingPlanTransaction.paymentIntentId);
    ResponseApi(res, {
      status: "OK",
      data: {
        clientSecret: paymentIntent.client_secret
      }
    })
  } else {
    // Create a customer 
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (user) {
      let customerId;
      if (!user.stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          phone: user.phoneNumber,
        })
        await usersCollection.updateOne({ _id: new ObjectId(userId) }, { $set: { stripeCustomerId: customer.id } })
        customerId = customer.id;
      } else {
        customerId = user.stripeCustomerId;
      }
      const paymentIntent = await stripe.paymentIntents.create({
        customer: customerId,
        amount: Math.round(amount * 100),
        currency: currency,
        metadata: {
          planId: planId,
        },
        automatic_payment_methods: { enabled: true },
      })
      const newTransaction = {
        paymentIntentId: paymentIntent.id,
        amount: Math.round(amount),
        currency: currency,
        planId: planId,
        status: "created",
        user: {
          _id: user?._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber
        },
        modeOfPayment: "online",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await userTransactions.insertOne(newTransaction);
      ResponseApi(res, {
        status: "OK",
        data: {
          clientSecret: paymentIntent.client_secret
        }
      })
    } else {
      throw Error("No User Found.")
    }
  }
}))


async function onProcessing(paymentIntentProcessing: any) {
  const filter = { paymentIntentId: paymentIntentProcessing.id }
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntentProcessing.payment_method);
  return await userTransactions.updateOne(filter, {
    $set: {
      status: "processing",
      paymentMethod: paymentMethod.type,
      updatedAt: new Date()
    }
  })
}
async function onSuccess(paymentIntentSucceeded: any) {
  const filter = { paymentIntentId: paymentIntentSucceeded.id }
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntentSucceeded.payment_method);

  await userTransactions.updateOne(filter, {
    $set: {
      status: "succeeded",
      paymentMethod: paymentMethod.type,
      updatedAt: new Date()
    }
  })
  const updatedTrans = await userTransactions.findOne(filter);
  if (updatedTrans) {
    const draft = await draftsCollection.findOne({ _id: new ObjectId(updatedTrans.planId) })
    // Create a new Plan
    if (draft) {
      await PlansController.create({
        ...draft,
        status: 'active',
        paymentDetails: {
          transactionId: updatedTrans?._id.toString(),
          modeOfPayment: "online",
          status: "paid"
        }
      })
      await draftsCollection.deleteOne({ _id: new ObjectId(updatedTrans.planId) })
    }
  }


}

async function onFailed(paymentIntentPaymentFailed: any) {
  const filter = { paymentIntentId: paymentIntentPaymentFailed.id }
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntentPaymentFailed.payment_method);
  return await userTransactions.updateOne(filter, {
    $set: {
      status: "failed",
      paymentMethod: paymentMethod.type,
      updatedAt: new Date()
    }
  })
}

const endpointSecret = "whsec_13PjhhqvOIKxTbfS8BlnIDFwH9hOSpne";

// @ts-ignore
router.post('/webhook', Express.raw({ "verify": (req, res, bug) => req.rawBody = bug.toString() }), (request, response) => {
  // @ts-ignore
  let event = request.rawBody;
  // Only verify the event if you have an endpoint secret defined.
  // Otherwise use the basic event deserialized with JSON.parse
  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = request.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        // @ts-ignore
        request.rawBody,
        // @ts-ignore
        signature,
        endpointSecret
      );
    } catch (err) {
      // @ts-ignore
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return response.sendStatus(400);
    }
  }

  switch (event.type) {
    case 'payment_intent.created':
      const paymentIntentCreated = event.data.object;
      // Then define and call a function to handle the event payment_intent.created
      break;
    case 'payment_intent.processing':
      const paymentIntentProcessing = event.data.object;
      // Then define and call a function to handle the event payment_intent.processing
      onProcessing(paymentIntentProcessing)
      break;
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object;
      // Then define and call a function to handle the event payment_intent.succeeded
      onSuccess(paymentIntentSucceeded)
      break;
    case 'payment_intent.payment_failed':
      const paymentIntentPaymentFailed = event.data.object;
      // Then define and call a function to handle the event payment_intent.payment_failed
      onFailed(paymentIntentPaymentFailed)
      break;
    case 'payment_intent.canceled':
      const paymentIntentCanceled = event.data.object;
      // Then define and call a function to handle the event payment_intent.canceled
      break;
    case 'payment_intent.requires_action':
      const paymentIntentRequiresAction = event.data.object;
      // Then define and call a function to handle the event payment_intent.requires_action
      break;

    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.sendStatus(200);
});

export default router;