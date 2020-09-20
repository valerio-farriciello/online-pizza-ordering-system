//Author: Valerio Farriciello
const ejs = require('ejs');
//this will parse the body into a JSON object since the method JSON.parse(body) doesn't work
const { parse } = require('querystring');

const register_path = './views/pages/register.ejs';




exports.get = function(req, res, isLoggedIn, customerID) {
    //this value is set to true just to hide the error message
    var hasBeenRegistered = true;
    ejs.renderFile(register_path, {hasBeenRegistered : hasBeenRegistered, customerID : customerID, isLoggedIn : isLoggedIn}, (err, data) => {
        //console.log(err || data);
        res.end(data);
    });
};



exports.post = function (req, res, isLoggedIn, customerID) {

    body = '';

    req.on('data', function (chunk) {
        body += chunk.toString();
    });

    req.on('end', function () {
        customer = parse(body);
        //call the database, pass the customer object, if it has been registered 'hasBeenRegistered' becomes true
        require('../model/dataSource').registerACustomer(customer, function(hasBeenRegistered, errorMessage){
            if(hasBeenRegistered){
                require('../router').login(customer.customerID, req, res);
            }
            else{
                //redirect to the same page
                ejs.renderFile(register_path, {hasBeenRegistered : hasBeenRegistered, errorMessage : errorMessage, customerID : customerID, isLoggedIn : isLoggedIn}, (err, data) => {
                    //console.log(err || data);
                    res.end(data);
                });
            }
        });
    });
};
