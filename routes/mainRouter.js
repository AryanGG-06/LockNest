const express = require('express')
const mainRouter = express.Router();
const mainController = require('../controllers/mainController')

mainRouter.get("/add-vault", mainController.getAddVault);
mainRouter.post("/add-vault", mainController.postAddVault)
mainRouter.get("/unlock-vault", mainController.getSavedVault)
mainRouter.post("/saved-vault", mainController.postSavedVault)
mainRouter.post("/saved-vault/:homeId", mainController.postDeleteField)
mainRouter.get("/update-vault/:Id", mainController.getUpdateField)
mainRouter.post("/update-vault", mainController.postUpdateField)
mainRouter.get("/generator", mainController.getPasswordGenerator)

module.exports = mainRouter;