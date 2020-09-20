//Author: Valerio Farriciello
const ejs = require('ejs');
const orderPlaced_path = './views/pages/orderPlaced.ejs';


exports.get = function(req, res, isLoggedIn, customerID, message) {
    ejs.renderFile(orderPlaced_path, {message : message, customerID : customerID, isLoggedIn : isLoggedIn}, (err, data) => {
        //console.log(err || data);
        res.end(data);
    });
};