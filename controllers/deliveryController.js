//Author: Valerio Farriciello
const ejs = require('ejs');
//this will parse the body into a JSON object since the method JSON.parse(body) doesn't work
const { parse } = require('querystring');
const delivery_path = './views/pages/delivery.ejs';


exports.get = function(req, res, isLoggedIn, customerID) {
    let errorMessage = "";
    ejs.renderFile(delivery_path, {errorMessage : errorMessage, customerID : customerID, isLoggedIn : isLoggedIn}, (err, data) => {
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
        else if(customerOrderDetails.address.length < 6 || customerOrderDetails.phoneNumber.length > 50){
            detailsAreValid = false;
            errorMessage = "ERROR: ADDRESS NOT VALID";
        }

        if(customerOrderDetails.paymentMethod === "card"){
            if(customerOrderDetails.cardNumber.length < 10 || customerOrderDetails.cardNumber.length > 18){
                detailsAreValid = false;
                errorMessage = "ERROR: CARD NOT VALID";
            }
            else if(customerOrderDetails.expiry.length !== 5){
                detailsAreValid = false;
                errorMessage = "ERROR: CARD NOT VALID ";
            }
            else if(customerOrderDetails.cvv.length !== 3){
                detailsAreValid = false;
                errorMessage = "ERROR: CARD NOT VALID ";
            }
        }

        if(detailsAreValid){
            require('../model/dataSource').getPayments(function (max){
                if(typeof customerOrderDetails.email === "undefined") customerOrderDetails.email = null;
                let payment = {paymentID : ("PM" + max), orderID : null, paymentMethod : customerOrderDetails.paymentMethod, cardNumber : customerOrderDetails.cardNumber,
                    expiry : customerOrderDetails.expiry, cvv : customerOrderDetails.cvv, totalPaid : 0};
                let order = {orderID : null, name : customerOrderDetails.fullName, address : customerOrderDetails.address, phoneNumber : customerOrderDetails.phoneNumber, email : customerOrderDetails.optionalEmail};
                require('../router').setOrderAndPayment(payment, order, req, res);
            });
        }
        else{
            ejs.renderFile(delivery_path, {errorMessage : errorMessage, customerID : customerID, isLoggedIn : isLoggedIn}, (err, data) => {
                //console.log(err || data);
                res.end(data);
            });
        }


    });
};
