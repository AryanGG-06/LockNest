const express = require('express')
const authRouter = express.Router();
const authController = require('../controllers/authController')

authRouter.get("/login", authController.getLogin)
authRouter.post("/auth/login", authController.postLogin)
authRouter.post("/auth/signup", authController.postSignup)
authRouter.post("/login", authController.postLogout)
authRouter.get("/unlock", authController.getUnlockMasterKey)
authRouter.post("/auth/unlock", authController.postUnlockMasterKey)
authRouter.get("/auth/createkey", authController.getCreateMasterKey)
authRouter.post("/auth/createdkey", authController.postCreateMasterKey)



module.exports = authRouter;