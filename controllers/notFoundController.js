//Author: Valerio Farriciello
const ejs = require('ejs');
const notFound_path = './views/pages/notFound.ejs';


exports.get = function(req, res, isLoggedIn, customerID) {

    ejs.renderFile(notFound_path, {customerID : customerID, isLoggedIn : isLoggedIn}, (err, data) => {
        //console.log(err || data);
        res.end(data);
    });
};
