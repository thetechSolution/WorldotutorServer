import sgMail from "@sendgrid/mail";
import express from "express";
import asyncHandler from 'express-async-handler';
import { ObjectId } from "mongodb";
import passport from "passport";
import { accountsCollection, emailOTPCollection } from "../config/mongodb-config";
import AccountsController from "../controller/accounts";
import AnalyticsController from "../controller/admin/analytics";
import { ResponseApi } from "../core/response";
import { ADMIN_URL, STUDENT_URL, TUTOR_URL } from "../utils/constants";

const router = express.Router();

router.post("/mobile/authStatus", async (req, res) => {
  const { user } = req.body;
  if (user) {
    const result = await accountsCollection.findOne({
      _id: new ObjectId(user.id!),
      role: user.role
    });
    ResponseApi(res, { status: 'OK', message: 'Sucesss', data: result });
  } else {
    ResponseApi(res, {
      status: 'UNAUTHENTICATED',
      message: 'You are not authenticated',
    });
  }
})

router.get("/authStatus", (req, res) => {
  if (req.isAuthenticated()) {
    // @ts-ignore
    if (req.headers.origin === TUTOR_URL && req.session.passport.user.role !== "tutor") {
      ResponseApi(res, {
        status: 'UNAUTHENTICATED',
        message: 'You are not authenticated',
      });
      return;
    }
    // @ts-ignore
    if (req.headers.origin === STUDENT_URL && req.session.passport.user.role !== "user") {
      ResponseApi(res, {
        status: 'UNAUTHENTICATED',
        message: 'You are not authenticated',
      });
      return;
    }
    // @ts-ignore
    if (req.headers.origin === ADMIN_URL && req.session.passport.user.role !== "admin") {
      ResponseApi(res, {
        status: 'UNAUTHENTICATED',
        message: 'You are not authenticated',
      });
      return;
    }
    ResponseApi(res, { status: 'OK', message: 'Sucesss', data: req.user });
  } else {
    ResponseApi(res, {
      status: 'UNAUTHENTICATED',
      message: 'You are not authenticated',
    });
  }
});

router.post(
  "/auth/email-password",
  passport.authenticate("local", {
    successRedirect: "/auth/local-callback",
    failureRedirect: "/auth/failed",
  }), asyncHandler((req, res, next) => {

  })
);

router.get("/auth/failed", (req, res) => {
  ResponseApi(res, { status: "BAD_REQUEST", message: req.flash("error")[0] });
});

router.get("/auth/email-otp/failed", (req, res) => {
  ResponseApi(res, { status: "OK", message: req.flash("error")[0] });
});


router.get("/auth/local-callback", (req, res) => {
  // req.user coming from passport.deserializeUser
  if (req.user) {
    ResponseApi(res, { status: "OK", message: "Sucesss", data: req.user });
  } else {
    ResponseApi(res, {
      status: "UNAUTHENTICATED",
      message: "You are not authenticated",
    });
  }
});

router.get(
  "/auth/google/tutor",
  passport.authenticate("google-tutor", { scope: ["profile", "email"] })
);
router.get(
  "/auth/google/user",
  passport.authenticate("google-user", { scope: ["profile", "email"] })
);
router.get(
  "/auth/callback/tutor",
  passport.authenticate("google-tutor", { failureRedirect: "/login" }),
  async function (req, res) {
    res.redirect(`${TUTOR_URL}/login`);
  }
);

router.get(
  "/auth/callback/user",
  passport.authenticate("google-user", { failureRedirect: "/login" }),
  async function (req, res) {
    res.redirect(`${STUDENT_URL}/login`);
  }
);


router.get(
  "/mobile/auth/google/user",
  passport.authenticate("mobile-google-user", { scope: ["profile", "email"] })
);
router.get(
  "/mobile/auth/google/tutor",
  passport.authenticate("mobile-google-tutor", { scope: ["profile", "email"] })
);
router.get(
  "/mobile/auth/callback/user",
  passport.authenticate("mobile-google-user", { failureRedirect: "/login" }),
  async function (req, res) {
    // @ts-ignore
    res.redirect(`intent://wot/login?userId=${req?.user?.id}#Intent;scheme=wot_student;package=com.wot_student;end`);
  }
);
router.get(
  "/mobile/auth/callback/tutor",
  passport.authenticate("mobile-google-tutor", { failureRedirect: "/login" }),
  async function (req, res) {
    // @ts-ignore
    res.redirect(`intent://wottutor/login?userId=${req?.user?.id}#Intent;scheme=wot_tutor;package=com.wot_tutor;end`);
  }
);


router.post("/auth/apple", () => { });

router.post("/auth/email-otp", asyncHandler((req, res) => {
  const { email } = req.body;
  console.log()
  const otp = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;
  const msg = {
    to: email, // Change to your recipient
    from: "hr@worldotutor.com", // Change to your verified sender
    subject: "OTP",
    text: "OTP for signin",
    html: `<strong>OTP: ${otp}</strong>`,
  };
  sgMail.setApiKey(process.env.SENDGRID_KEY!);
  sgMail
    .send(msg)
    .then(async () => {
      await emailOTPCollection.insertOne({
        to: email,
        from: "hr@worldotutor.com",
        subject: "OTP",
        text: "OTP for signin",
        html: `<strong>OTP: ${otp}</strong>`,
        otp: otp,
        expiry: Date.now() + 30 * 60000,
      });
     
      ResponseApi(res, { status: "OK", message: "OTP send" });
    })
    .catch((error) => {
      console.log(error)
      ResponseApi(res, { status: "CRASHED", message: "Something went wrong" });
    });
}));

router.post(
  "/auth/email-otp/verify",
  passport.authenticate("token", {
    successRedirect: "/authStatus", failureRedirect: "/auth/email-otp/failed", failureFlash: true
  }),
  (req, res) => {
    console.log(req.user);
  }
);

router.post("/accept-terms-of-usage", async (req, res) => {
  const { id } = req.body;
  await AccountsController.update(
    {
      termsOfUse: "accepted",
    },
    id
  );
  ResponseApi(res, {
    status: "OK",
  });
});

router.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    // if (err) {
    //   return next(err);
    // }
  });
  ResponseApi(res, {
    status: "OK",
    message: "Logged out",
  });
});

router.post("/add-user-location", async (req, res) => {
  console.log(req.body);
  const result = await AnalyticsController.addUserLocation(req.body);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})


export default router;
