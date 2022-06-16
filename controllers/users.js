const { User } = require('../models');

exports.getAuthStatus = (req, res) => {
    User.findOne({attributes: ['id', 'pseudo'], where: {id: req.auth.userId}})
    .then(user => {
        console.log(user);
        res.status(200).json(user);
    })
    .catch(error => {
        console.log('Error in usersCtrl.getAuthStatus : ', error);
    })
}