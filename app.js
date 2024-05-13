var express = require('express');

require('dotenv').config();

const bodyParser = require('body-parser');

const router = require('./routes/routes')

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(function(req, res, next){
    res.setHeader("Access-Control-Allow-Origine", "*");
    res.setHeader("Access-Control-Allow-Credentials", "*");
    res.setHeader("Access-Control-Allow-Methods","DELETE,GET,POST,PUT");
    next();
});

app.get('/', (req, res) =>{
    //req.session.test = 'DATA_TEST';
    res.send('Salut !')
});

app.get('/logout', (req, res) => {
    //req.session.test = null;
    res.send('Your logged out !')
});

app.use('/api', router);

app.use((req, res, next) => {
    res.status(404).json({error: 'BAD_METHOD_OR_NOT_FOUND', message: "NOT FOUND"})
});

app.listen(process.env.SERVER_PORT, () =>{
    console.log(" Server running on ", process.env.SERVER_PORT);
});