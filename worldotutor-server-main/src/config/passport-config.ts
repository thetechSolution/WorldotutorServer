import bcrypt from "bcrypt";
import { ObjectId, ObjectID } from "bson";
import passport from "passport";
import GoogleStrategy from 'passport-google-oauth20';
import LocalStrategy from 'passport-local';
import { UniqueTokenStrategy } from 'passport-unique-token';
import { accountsCollection, emailOTPCollection } from "./mongodb-config";


interface Account {
  _id: ObjectId,
  email: string,
  providers: string[],
  role?: ["user" | "admin" | "tutor"];
  password?: string,
  googleID?: string,
  appleID?: string,
  termsOfUse?: "pending" | "accepted" | "declined"
  signedInAt: Date,
  lastSignedInAt: Date
}

export function initPassportStragtegies() {
  passport.use("local", new LocalStrategy.Strategy({
    usernameField: "email",
    passReqToCallback: true
  },
    async function (req, username, password, cb) {
      const result = await accountsCollection.findOne({ email: username });
      await accountsCollection.updateOne({ email: username }, {
        $set: { lastSignedInAt: new Date() },
        $addToSet: { providers: "email-password", role: "admin" }
      })
      if (result) {
        const checkPass = await bcrypt.compare(password, result.password);
        if (checkPass) {
          // this will get stored in session in db
          return cb(null, { id: result._id, role: "admin" });
        } else {
          req.flash("error", "Wrong Password")
          return cb(null, false, { message: "Wrong Password" })
        }
      } else {
        // try {
        //   const hash = await bcrypt.hash(password, 10);
        //   let newAccount: Account = {
        //     _id: new ObjectID(),
        //     email: username,
        //     password: hash,
        //     providers: ["email"],
        //     role: [req.body.role],
        //     signedInAt: new Date(),
        //     lastSignedInAt: new Date()
        //   }
        //   const result = await accountsCollection.insertOne(newAccount);
        //   return cb(null, { id: result.insertedId });
        // } catch (err) {
        //   console.log(err);
        //   req.flash("error", "Something Went Wrong")
        //   return cb(err);
        // }
        // req.flash("error", "Unauthorised access!");
        // return cb(null, false, { message: "Unauthorised access!" });
      }

    })
  );

  passport.use("google-tutor",
    new GoogleStrategy.Strategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: "/auth/callback/tutor",
        proxy: true,
        passReqToCallback: true
      },
      // @ts-ignore
      async function (req, accessToken, refreshToken, profile, cb) {
        try {
          // @ts-ignore
          let acc = await accountsCollection.findOne({ email: profile.emails[0].value });
          // @ts-ignore
          await accountsCollection.updateOne({ email: profile.emails[0].value }, {
            $set: { lastSignedInAt: new Date() },
            $addToSet: { providers: "google", role: "tutor" }
          })
          if (acc) {
            return cb(null, { id: acc._id, role: "tutor" });
          } else {
            let newAccount: Account = {
              _id: new ObjectID(),
              // @ts-ignore
              email: profile.emails[0].value,
              googleID: profile.id,
              providers: ["google"],
              role: ["tutor"],
              termsOfUse: "pending",
              signedInAt: new Date(),
              lastSignedInAt: new Date()
            }
            let acc = await accountsCollection.insertOne(newAccount);
            return cb(null, { id: acc.insertedId, role: "tutor" });
          }
        } catch (err) {
          console.error(err);
        }
      })
  )
  passport.use("google-user",
    new GoogleStrategy.Strategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: "/auth/callback/user",
        proxy: true,
        passReqToCallback: true
      },
      // @ts-ignore
      async function (req, accessToken, refreshToken, profile, cb) {
        try {
          // @ts-ignore
          let acc = await accountsCollection.findOne({ email: profile.emails[0].value });
          // @ts-ignore
          await accountsCollection.updateOne({ email: profile.emails[0].value },
            {
              $set: { lastSignedInAt: new Date() },
              $addToSet: { providers: "google", role: "user" }
            })
          if (acc) {
            return cb(null, { id: acc._id, role: "user" });
          } else {
            let newAccount: Account = {
              _id: new ObjectID(),
              // @ts-ignore
              email: profile.emails[0].value,
              googleID: profile.id,
              providers: ["google"],
              termsOfUse: "pending",
              role: ["user"],
              signedInAt: new Date(),
              lastSignedInAt: new Date()
            }
            let acc = await accountsCollection.insertOne(newAccount);
            return cb(null, { id: acc.insertedId, role: "user" });
          }
        } catch (err) {
          console.error(err);
        }
      })
  )

  passport.use("mobile-google-tutor",
    new GoogleStrategy.Strategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: "/mobile/auth/callback/tutor",
        proxy: true,
        passReqToCallback: true
      },
      // @ts-ignore
      async function (req, accessToken, refreshToken, profile, cb) {
        try {
          // @ts-ignore
          let acc = await accountsCollection.findOne({ email: profile.emails[0].value });
          // @ts-ignore
          await accountsCollection.updateOne({ email: profile.emails[0].value }, {
            $set: { lastSignedInAt: new Date() },
            $addToSet: { providers: "google", role: "tutor" }
          })
          if (acc) {
            return cb(null, { id: acc._id, role: "tutor" });
          } else {
            let newAccount: Account = {
              _id: new ObjectID(),
              // @ts-ignore
              email: profile.emails[0].value,
              googleID: profile.id,
              providers: ["google"],
              role: ["tutor"],
              termsOfUse: "pending",
              signedInAt: new Date(),
              lastSignedInAt: new Date()
            }
            let acc = await accountsCollection.insertOne(newAccount);
            return cb(null, { id: acc.insertedId, role: "tutor" });
          }
        } catch (err) {
          console.error(err);
        }
      })
  )
  passport.use("mobile-google-user",
    new GoogleStrategy.Strategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: "/mobile/auth/callback/user",
        proxy: true,
        passReqToCallback: true
      },
      // @ts-ignore
      async function (req, accessToken, refreshToken, profile, cb) {
        try {
          // @ts-ignore
          let acc = await accountsCollection.findOne({ email: profile.emails[0].value });
          // @ts-ignore
          await accountsCollection.updateOne({ email: profile.emails[0].value },
            {
              $set: { lastSignedInAt: new Date() },
              $addToSet: { providers: "google", role: "user" }
            })
          if (acc) {
            return cb(null, { id: acc._id, role: "user" });
          } else {
            let newAccount: Account = {
              _id: new ObjectID(),
              // @ts-ignore
              email: profile.emails[0].value,
              googleID: profile.id,
              providers: ["google"],
              termsOfUse: "pending",
              role: ["user"],
              signedInAt: new Date(),
              lastSignedInAt: new Date()
            }
            let acc = await accountsCollection.insertOne(newAccount);
            return cb(null, { id: acc.insertedId, role: "user" });
          }
        } catch (err) {
          console.error(err);
        }
      })
  )

  passport.use("token", new UniqueTokenStrategy({ tokenField: "otp", passReqToCallback: true }, async (req, token, done) => {
    const { email, role } = req.body;
    const result = await emailOTPCollection.find({ to: email }, { sort: { expiry: -1 } }).toArray();

    if (result.length > 0) {
      const emailOTPData = result[0];
      if (emailOTPData.expiry < Date.now()) {
        return done(null, false, { message: "OTP Expired" })
      }

      if (emailOTPData.otp === token) {
        try {
          let user = await accountsCollection.findOne({ email: email });
          await accountsCollection.updateOne({ email: email }, {
            $set:
              { lastSignedInAt: new Date() },
            $addToSet: { providers: "email-otp", role: role }
          })
          if (user) {
            return done(null, { id: user._id, role: role });
          } else {
            let newAccount: Account = {
              _id: new ObjectID(),
              email: email,
              providers: ["email-otp"],
              termsOfUse: "pending",
              role: [role],
              signedInAt: new Date(),
              lastSignedInAt: new Date()
            }
            let user = await accountsCollection.insertOne(newAccount);
            return done(null, { id: user.insertedId, role: role });
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        return done(null, false, req.flash("error", "OTP Mismatched"))
      }
    } else {
      req.flash("error", "OTP Not found")
      return done(null, false, req.flash("error", "OTP Not Found or Expired"))
    }
  }))

}

