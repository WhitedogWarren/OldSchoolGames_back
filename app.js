const express = require('express');
const app = express();
const path = require('path');
//const mysql = require('mysql2');

require('dotenv').config();

//gestion du cors
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

//Permet la récupération des données POST ( req.body )
app.use(express.json());

//création des routes
app.use('/images', express.static(path.join(__dirname, 'images')));

const authRoute = require('./routes/auth');
const userRoute = require('./routes/user');

app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);

// 404
app.use('/', (req, res) => {
    console.log('route demandée :');
    console.log(req.originalUrl);
    res.status(404).json({message: 'Aucune ressource ne correspond à votre demande'});
})

module.exports = app;