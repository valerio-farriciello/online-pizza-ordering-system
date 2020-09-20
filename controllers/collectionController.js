//Author: Valerio Farriciello
const ejs = require('ejs');
const collection_path = './views/pages/collection.ejs';
const { parse } = require('querystring');

exports.get = function(req, res, isLoggedIn, customerID) {
    let errorMessage = "";
    ejs.renderFile(collection_path, {errorMessage : errorMessage, customerID : customerID, isLoggedIn : isLoggedIn}, (err, data) => {
        //console.log(err || data);
        res.end(data);
    });
};


exports.post = function (req, res, isLoggedIn, customerID) {
    let errorMessage = "";

    let body = '';

    req.on('data', function (chunk) {
        body += chunk.toString();
    });

    req.on('end', function () {
        let detailsAreValid = true;
        let customerOrderDetails = parse(body);

        if(customerOrderDetails.fullName.length < 4 || customerOrderDetails.fullName.length > 22){
            detailsAreValid = false;
            errorMessage = "ERROR: NAME NOT VALID";
        }
        else if(customerOrderDetails.phoneNumber.length < 6 || customerOrderDetails.phoneNumber.length > 15){
            detailsAreValid = false;
            errorMessage = "ERROR: PHONE NUMBER NOT VALID";
        }

        if(detailsAreValid){
            require('../model/dataSource').getPayments(function (max){
                let payment = {paymentID : ("PM" + max), orderID : null, paymentMethod : "cash", cardNumber : "", expiry : "", cvv : "", totalPaid : 0};
                let order = {orderID : null, name : customerOrderDetails.fullName, address : null, phoneNumber : customerOrderDetails.phoneNumber, email : null};
                require('../router').setOrderAndPayment(payment, order, req, res);
            });

        }
        else{
            ejs.renderFile(collection_path, {errorMessage : errorMessage, customerID : customerID, isLoggedIn : isLoggedIn}, (err, data) => {
                //console.log(err || data);
                res.end(data);
            });
        }

    });
};