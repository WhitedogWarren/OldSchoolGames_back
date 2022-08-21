const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require("sequelize");
//const {parse: pgParse} = require('postgres-array');

const { User } = require('../models');

const handleError = (label, message, error, res) => {
    console.error(`${label} :\n`, error);
    res.status(500).json({message});
}

const checkSignupFields = body => {
    //Check for empty fields
    let emptyFields = false;
    for(const [key, value] of Object.entries(body)) {
        if(value === '' || !value) {
            emptyFields ? emptyFields.push(key) : emptyFields = [key];
        }
    }

    //check for invalid fields
    const pseudoRegexp = /[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð.' \-_]+$/u;
    const emailRegexp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const passwordRegexp = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[+\-/=!@_&*])[0-9a-zA-Z\+\-\/\=\!@_&\*]{8,}$/;
    let invalidFields = false;
    if(body.pseudo !== '' && !pseudoRegexp.test(body.pseudo)) {
        invalidFields = ['pseudo'];
    }
    if(body.email !== '' && !emailRegexp.test(body.email)) {
        invalidFields ? invalidFields.push('email') : invalidFields = ['email'];
    }
    if(body.password !== '' && !passwordRegexp.test(body.password)) {
        invalidFields ? invalidFields.push('password') : invalidFields = ['password'];
    }
    if(body.password_confirm !== '' && !passwordRegexp.test(body.password_confirm)) {
        invalidFields ? invalidFields.push('password_confirm') : invalidFields = ['password_confirm'];
    }
    if(body.password !== '' && body.password_confirm !== '' && body.password !== body.password_confirm) {
        invalidFields ? invalidFields.push('password_mismatch') : invalidFields = ['password_mismatch'];
    }
    return {emptyFields, invalidFields};
}

exports.signup = async (req, res) => {
    //check for form validity
    let {emptyFields, invalidFields} = checkSignupFields(req.body);
    
    if(emptyFields || invalidFields) {
        return res.status(401).json({message: 'Formulaire invalide', user: null, token: null, emptyFields, invalidFields});
    }

    //check if pseudo or password are already used.
    const alreadyUsed = await User.findAll({attributes: ['email', 'pseudo'], where: { [Op.or]: [{email: req.body.email}, {pseudo: req.body.pseudo}]}});
    if(alreadyUsed.length > 0) {
        return res.status(401).json({message: 'already used'});
    }
    
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
            handleError('error in authCtrl.signup', 'erreur lors de la création du compte. Veuillez réessayer', error, res);
        })
    })
    .catch(error => {
        handleError('error in authCtrl.signup', 'erreur lors de la création du compte. Veuillez réessayer', error, res);
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