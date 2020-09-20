//Author: Valerio Farriciello
const ejs = require('ejs');
const myDetails_path = './views/pages/myDetails.ejs';


exports.get = function(req, res, isLoggedIn, customerID) {

    if(customerID !== ""){
        require('../model/dataSource').getCustomerDetails(customerID, function (customerDetails) {
            ejs.renderFile(myDetails_path, {customerDetails : customerDetails, customerID : customerID, isLoggedIn : isLoggedIn}, (err, data) => {
                //console.log(err || data);
                res.end(data);
            });
        });
    }
    else{
        let customerDetails = {fname: "", lname: "", address: "", email: ""};
        ejs.renderFile(myDetails_path, {customerDetails : customerDetails, customerID : customerID, isLoggedIn : isLoggedIn}, (err, data) => {
            //console.log(err || data);
            res.end(data);
        });
    }



};