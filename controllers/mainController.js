const Data = require('../model/mainModel')
const user = require('../model/authModel')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
require('dotenv').config();
const { encrypt } = require("../utils/encryption");
const { decrypt } = require("../utils/encryption");
const { check, validationResult } = require('express-validator');

exports.getAddVault = (req, res, next) =>{
    console.log(req.isLoggedIn)
    res.render("vault", {  isLoggedIn : req.isLoggedIn , editing : false, isMasterKey : req.isMasterKey})
}

exports.postAddVault = async(req, res, next) =>{
    console.log(req.body)
    const {platform, password, masterKey} = req.body;
    const userId = req.session.user._id;
    const User = await user.findById(userId)
    const isMatch = await bcrypt.compare(masterKey, User.masterKey);
    if(isMatch){
        const encrypted = encrypt(password);
        const data = new Data({platform, password: encrypted.encryptedData, iv: encrypted.iv});
        await data.save();
        User.savedPass.push(data)  
        await User.save()
        res.redirect('/unlock-vault?verify=true')
    }else{
        res.render("vault", {  isLoggedIn : req.isLoggedIn , editing : false, isMasterKey : req.isMasterKey, errorMessage : ['Invalid master key']})
    }
}

exports.getSavedVault = async (req, res, next) => {
    const verify = req.query.verify === 'true';
    const errorMessage = req.query.error === 'invalid-master-key'
        ? ['Invalid master key']
        : [];
    res.render('unlock', { isLoggedIn : req.isLoggedIn, verify : verify, errorMessage : errorMessage})


}

exports.postSavedVault = async (req,res,next) =>{
    const {masterKey} = req.body;
    const userId = req.session.user._id;
    const User = await user.findById(userId)
    const isMatch = await bcrypt.compare(masterKey, User.masterKey);
    if(isMatch){
        console.log('loggedIn')
        const User = await user.findById(userId).populate('savedPass')
        const decryptedData = User.savedPass.map(item => ({
            ...item.toObject(),
            password: decrypt(item.password, item.iv)
        }));
        res.render('saved-vault', {
            dataPool: decryptedData,  
            isLoggedIn : req.isLoggedIn, 
            isMasterKey : req.isMasterKey
        })
    }else{
        return res.redirect('/unlock-vault?verify=true&error=invalid-master-key')
    }
    
}
exports.postDeleteField = async (req, res, next) =>{
    const deleteId = req.body.id
    const deletedField = await Data.findByIdAndDelete(deleteId)
    const userId = req.session.user._id;
    const dUser = await user.findById(userId);
    dUser.savedPass.pull(deleteId);
    await dUser.save();

    const User = await user.findById(userId).populate('savedPass')
    res.render('saved-vault', {
            dataPool: User.savedPass,  
            isLoggedIn : req.isLoggedIn, 
            isMasterKey : req.isMasterKey
        })

}

exports.getUpdateField = async (req, res, next) => {
    const Id = req.params.Id
    console.log(Id)
    const editing = req.query.editing === 'true'
    const data = await Data.findById(Id).populate()
    const decryptedData = {
        ...data.toObject(),
        password: decrypt(data.password, data.iv)
    };
    console.log(data)
    res.render('vault', {data : decryptedData, editing : editing ,  isLoggedIn : req.isLoggedIn, isMasterKey : req.isMasterKey})
}

exports.postUpdateField = async (req,res,next) => {
    const Id = req.body.id
    console.log('here is Id',Id)
    const {platform, password, masterKey} = req.body;
    const userId = req.session.user._id;
    const User = await user.findById(userId)
    console.log('here is masterKey',masterKey)
    const isMatch = await bcrypt.compare(masterKey, User.masterKey);
    if(!isMatch){
        const data = await Data.findById(Id).populate()
        const decryptedData = {
            ...data.toObject(),
            password: decrypt(data.password, data.iv)
        };
        console.log(data)
        return res.render('vault', {data : decryptedData, editing : true ,  isLoggedIn : req.isLoggedIn, isMasterKey : req.isMasterKey, errorMessage : ['Invalid master key']})
    }
    const encrypted = encrypt(password);
    Data.findById(Id).then((data) => {
        data.platform = platform;
        data.password = encrypted.encryptedData;
        data.iv = encrypted.iv;
        data.save().then(() => {
        console.log('data added')
    })
    })
    res.redirect('/unlock-vault?verify=true')

}

exports.getPasswordGenerator = (req, res, next) => {
    res.render('generator', { isLoggedIn : req.isLoggedIn, isMasterKey : req.isMasterKey})
}

