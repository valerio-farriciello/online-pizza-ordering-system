//Author: Valerio Farriciello
const ejs = require('ejs');
//this will parse the body into a JSON object since the method JSON.parse(body) doesn't work
const { parse } = require('querystring');
const login_path = './views/pages/login.ejs';


exports.get = function(req, res, isLoggedIn, customerID) {
    let errorMessage = "";
    ejs.renderFile(login_path, {errorMessage : errorMessage, customerID : customerID, isLoggedIn : isLoggedIn}, (err, data) => {
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
        let customer = parse(body);
        //passing to the datasource the id and password to validate
        require('../model/dataSource').login(customer.customerID, customer.password, function(canLogIn){
            if(canLogIn){
                //set the login flag to true, passing the customerID and redirect the user to the home
                require('../router').login(customer.customerID, req, res);
            }
            else{
                let errorMessage = "ERROR: USERNAME OR PASSWORD NOT VALID";
                ejs.renderFile(login_path, {errorMessage : errorMessage, customerID : customerID, isLoggedIn : isLoggedIn}, (err, data) => {
                   // console.log(err || data);
                    res.end(data);
                });
            }

        });
    });
};