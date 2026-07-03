//external imports
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const bodyParser = require('body-parser');
const { default: mongoose } = require('mongoose');
const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app = express();

const URL = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3004;

//internal imports
const mainRouter = require('./routes/mainRouter');
const authRouter = require('./routes/authRouter');
const rootDir = require('./utils/pathUtils');

app.set('view engine', 'ejs');
app.set('views', 'views') ;

app.use(express.static(path.join(rootDir, 'public')));
app.use(express.urlencoded({ extended: true }));

const store = new MongoDBStore({
  uri: URL ,
  collection: 'Sessions'
});

app.use(session({
    secret : process.env.SESSION_SECRET,
    resave : false,
    saveUninitialized : false,
    store,
    rolling: true,
    cookie: {
        maxAge: 15 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    }
}))



app.use((req,res,next) => {
    req.isLoggedIn = req.session.isLoggedIn
    req.isMasterKey = req.session.isMasterKey
    next();
})


app.use(authRouter);

app.use((req,res,next) => {
    if(req.isLoggedIn){
        
        if(req.isMasterKey){
            return next()
        }else{
            return res.redirect('/unlock')
        }
    }else{
        return res.redirect('/login')
    }
})

app.use(mainRouter);

app.use((req, res) => {
    res.status(404).render('404');
})


mongoose.connect(URL).then(() =>{
    console.log('connected to database')
    app.listen(PORT , () => {
        console.log(`server running on address http://localhost:${PORT}/add-vault `)
    })
})
