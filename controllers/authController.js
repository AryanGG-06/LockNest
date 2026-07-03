const user = require('../model/authModel')
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs')


exports.getLogin = (req, res, next) =>{
    res.render("login", { isLoggedIn : req.isLoggedIn})
}

exports.postLogin = async (req, res, next) =>{
    console.log(req.body);
    const {email, password} = req.body
    const User = await user.findOne({email});
    if(!User){
        req.session.isLoggedIn = false;
        console.log('login failed')
        return res.render("login", { isLoggedIn : req.isLoggedIn, errorMessage : ['Invalid email or password'], errorForm: 'login' })
    }

    const isMatch = await bcrypt.compare(password, User.password);
    console.log(isMatch);

    if(isMatch){
        req.session.isLoggedIn = true;
        req.session.user = {
            _id : User._id.toString(),
        }
        await req.session.save()
        res.redirect('/unlock')     
    }else{
        req.session.isLoggedIn = false;
        console.log('login failed')
        res.render("login", { isLoggedIn : req.isLoggedIn, errorMessage : ['Invalid email or password'], errorForm: 'login' })
    }
}

exports.postSignup = [
    check('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({min: 2})
    .withMessage('Full name must be at least 2 characters long')
    .matches(/^[A-Za-z\s]+$/)
    .withMessage('Full name must contain only letters'),

    check('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
    .custom(async (value) => {
    const existingUser = await user.findOne({ email: value });
    if (existingUser) {
        throw new Error('Email already exists, try logging in instead');
    }
    return true;
    }),

    check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({min: 8})
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),

    check('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, {req}) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }),
    async (req, res, next) =>{
    const { fullName, email, password, confirmPassword } = req.body || {}
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).render('login', {
            isLoggedIn: false,
            errorMessage: errors.array().map(err => err.msg),
            oldInput: { fullName, email, password, confirmPassword },
            errorForm: 'signup'
            
        })
    }
    console.log('here is body', fullName, email, password)
    bcrypt.hash(password,12).then(hashedPassword => {
        const User = new user({fullName, email, password: hashedPassword})
        User.save().then(() => {
        req.session.user = {
            _id : User._id.toString(),
        }
        req.session.save()
        req.session.isLoggedIn = true;
        res.redirect('/auth/createkey')
        })
    })

}]

exports.postLogout = async (req, res, next) =>{
    console.log("logged out")
    req.session.destroy((err) => {
        if(err){
            console.log('error deleting session', err)
        }    
    }) 
    res.clearCookie("connect.sid")
    res.redirect('/login')
}

exports.getUnlockMasterKey = async (req,res,next) => {
    if(!req.isLoggedIn ){
        return res.redirect('/login')
    }
    console.log(req.isLoggedIn)
    const userId = req.session.user._id
    const User = await user.findById(userId)
    if (!User.masterKey) {
        return res.redirect('/auth/createkey');
    }
    res.render('unlock', { isLoggedIn : req.isLoggedIn, verify : false})
    
    
}

exports.postUnlockMasterKey = async (req,res,next) => {
    const {masterKey} = req.body
    const userId = req.session.user._id
    const User = await user.findById(userId)
    const isMatch = await bcrypt.compare(masterKey, User.masterKey);
    if(isMatch){
        req.session.isMasterKey = true;
        res.redirect('/add-vault')
    }else{
        res.redirect('/unlock')
    }

}

// exports.getUnlockSavedVault = (req, res, next) => {
//     const query = req.query.verifyKey === true;
//     res.render('unlock', { isLoggedIn : req.isLoggedIn, query : query})
// }

exports.getCreateMasterKey = (req, res, next) => {
    console.log(req.isLoggedIn)
    if(!req.isLoggedIn){
        res.redirect('/login')
    }else{
        res.render('masterKey', { isLoggedIn : req.isLoggedIn})
    }   
}
    

exports.postCreateMasterKey =[ 
    check('masterKey')
    .isLength({ min: 6 })
    .withMessage('Master key must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Master key must contain at least one lowercase letter, one uppercase letter, and one number'),
    check('confirmMasterKey')
    .notEmpty()
    .withMessage('Confirm master key is required')
    .custom((value, { req }) => {
        if (value !== req.body.masterKey) {
            throw new Error('Master key and confirm master key do not match');
        }
        return true;
    }),

    async (req, res, next) => {
    const {masterKey} = req.body;
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(422).render('masterKey', {isLoggedIn : req.isLoggedIn, errorMessage : errors.array().map(err => err.msg)})
    }
    const userId = req.session.user._id
    const hashedMasterKey = await bcrypt.hash(masterKey, 6);
    const User = await user.findByIdAndUpdate(userId, { masterKey: hashedMasterKey });
    req.session.isMasterKey = true;
    res.redirect('/add-vault')
}]