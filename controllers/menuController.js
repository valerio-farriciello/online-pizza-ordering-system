//Author: Valerio Farriciello
const ejs = require('ejs');
const menu_path = './views/pages/menu.ejs';
const { parse } = require('querystring');

exports.get = function(req, res, isLoggedIn, customerID) {
    require('../model/dataSource').getPizzasAndSides(function (pizzas, sides){
        ejs.renderFile(menu_path, {pizzas : pizzas, sides : sides, customerID : customerID, isLoggedIn : isLoggedIn}, (err, data) => {
            //console.log(err || data);
            res.end(data);
        });
    });
};

exports.post = function(req, res) {
    body = '';

    req.on('data', function (chunk) {
        body += chunk.toString();
    });

    req.on('end', function () {
        let item = parse(body);

        //adding pizzas
        for(let i = 0; i < item.pizzas.length; i++){
            //the first element in the string is the qty, then the itemID
            let qty = + item.pizzas[i][0];
            if(qty > 0){
                for(let j = 0; j < qty; j++){
                    require('../router').addPizzas(item.pizzas[i].substring(1));
                }
            }
        }

        //adding sides
        for(let i = 0; i < item.sides.length; i++){
            //the first element in the string is the qty, then the itemID
            let qty = + item.sides[i][0];
            if(qty > 0){
                for(let j = 0; j < qty; j++){
                    require('../router').addSides(item.sides[i].substring(1));
                }
            }
        }

        //sends the user back to the same page
        req.method = "GET";
        require('../router').get(req, res);

    });
};