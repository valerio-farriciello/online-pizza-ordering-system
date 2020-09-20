//Author: Valerio Farriciello
const ejs = require('ejs');
const myOrders_path = './views/pages/myOrders.ejs';


exports.get = function(req, res, isLoggedIn, customerID) {

    require('../model/dataSource').getOrdersByAUser(customerID, function (ordersAndPayments) {

        ejs.renderFile(myOrders_path, {ordersAndPayments : ordersAndPayments, customerID : customerID, isLoggedIn : isLoggedIn}, (err, data) => {
            console.log(err || data);
            res.end(data);
        });

    });

};