//Author: Valerio Farriciello
const ejs = require('ejs');
const personalisedPizzas_path = './views/pages/personalisedPizzas.ejs';
const { parse } = require('querystring');


exports.get = function(req, res, isLoggedIn, customerID) {
    require('../model/dataSource').getToppings(function (toppings) {
        ejs.renderFile(personalisedPizzas_path, {toppings : toppings, customerID : customerID, isLoggedIn : isLoggedIn}, (err, data) => {
            //console.log(err || data);
            res.end(data);
        });
    });
};

exports.post = function(req, res, isLoggedIn, customerID) {
    body = '';

    req.on('data', function (chunk) {
        body += chunk.toString();
    });

    req.on('end', function () {
        let personalisedPizza = parse(body);

        require('../router').addPersonalisedPizza(personalisedPizza);
        //sends the user back to the same page
        req.method = "GET";
        require('../router').get(req, res);

    });
};