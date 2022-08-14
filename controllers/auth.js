const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {parse: pgParse} = require('postgres-array');

const { User } = require('../models');

exports.signup = (req, res) => {
    console.log(req.body);
    let emptyFields = false;
    if(req.body.pseudo == '' || !req.body.pseudo) {
        emptyFields = ['pseudo'];
    }
    if(req.body.email == '' || !req.body.email) {
        emptyFields ? emptyFields.push('email') : emptyFields = ['email'];
    }
    if(req.body.password == '' || !req.body.password) {
        emptyFields ? emptyFields.push('password') : emptyFields = ['password'];
    }
    if(req.body.password_confirm == '' || !req.body.password_confirm) {
        emptyFields ? emptyFields.push('password_confirm') : emptyFields = ['password_confirm'];
    }

    const pseudoRegexp = /[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð.' \-_]+$/u;
    const emailRegexp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const passwordRegexp = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z\+\-\/\=\!@_&\*]{8,}$/;
    let invalidFields = false;
    if(req.body.pseudo !== '' && !pseudoRegexp.test(req.body.pseudo)) {
        invalidFields = ['pseudo'];
    }
    if(req.body.email !== '' && !emailRegexp.test(req.body.email)) {
        invalidFields ? invalidFields.push('email') : invalidFields = ['email'];
    }
    if(req.body.password !== '' && !passwordRegexp.test(req.body.password)) {
        console.log(passwordRegexp.test(req.body.password));
        invalidFields ? invalidFields.push('password') : invalidFields = ['password'];
    }
    if(req.body.password_confirm !== '' && !passwordRegexp.test(req.body.password_confirm)) {
        invalidFields ? invalidFields.push('password_confirm') : invalidFields = ['password_confirm'];
    }
    if(req.body.password !== '' && req.body.password_confirm !== '' && req.body.password !== req.body.password_confirm) {
        invalidFields ? invalidFields.push('password_mismatch') : invalidFields = ['password_mismatch'];
    }
    if(emptyFields || invalidFields) {
        return res.status(401).json({message: 'Formulaire invalide', user: null, token: null, emptyFields, invalidFields});
    }
    //////
    // TODO : unique email validator
    //////
    
    bcrypt.hash(req.body.password, 10)
    .then(hash => {
        const user = User.create({
            pseudo: req.body.pseudo,
            email: req.body.email,
            password: hash,
            invited: [],
            invitedBy: []
        })
        .then((user) => {
            //console.log('user créé\n', typeof pgParse(user.dataValues.invited));
            // let testArray = pgParse(user.dataValues.invited);
            // testArray.push('test');
            // console.log(testArray);
            delete user.dataValues.password;
            delete user.dataValues.email;
            const token = jwt.sign(
                {userId: user.id},
                process.env.TOKEN_SECRET,
                { expiresIn: '24h' }
            )
            res.status(201).json({ message: 'utilisateur créé', user, token });
        })
        .catch(error => {
            console.log('error in authCtrl.signup : ', error);
            res.status(500).json({ message: 'erreur lors de la création du compte. Veuillez réessayer' });
        })
    })
    .catch(error => {
        console.log('error in controllers/auth.js : ', error);
        res.status(500).json({ message: 'erreur lors de la création du compte. Veuillez réessayer' })
    });
}

exports.login = (req, res) => {
    console.log(req.body);
    //////
    // TODO : contrôle des champs
    //////
    User.findOne({where: { email: req.body.email}, attributes: ['id', 'pseudo', 'password']})
    .then(user => {
        if(!user) {
            return res.status(404).json({message: 'adresse mail non reconnue', user: null, token: null});
        }
        bcrypt.compare(req.body.password, user.password)
        .then(valid => {
            if(!valid) {
                return res.status(401).json({ message: 'Password incorrect', user: null, token: null});
            }
            delete user.dataValues.password;
            res.status(200).json({
                message: 'Connexion réussie',
                user: user,
                token: jwt.sign(
                    {userId: user.id},
                    process.env.TOKEN_SECRET,
                    { expiresIn: '24h' }
                )
            })
        })
        .catch(error => {
            console.log('Error in authCtrl.login : ', error);
            return res.status(500).json({ message : 'Une erreur est survenue, veuillez réessayer' });
        })
    })
    .catch(error => {
        console.log('Error in authCtrl.login : ', error);
        return res.status(500).json({ message : 'Une erreur est survenue, veuillez réessayer' });
    })
}