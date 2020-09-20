//Author: Valerio Farriciello
const ejs = require('ejs');
const index_path = './views/pages/index.ejs';


exports.get = function(req, res, isLoggedIn, customerID) {

	ejs.renderFile(index_path, {customerID : customerID, isLoggedIn : isLoggedIn}, (err, data) => {
		//console.log(err || data);
		res.end(data);
	});
};
