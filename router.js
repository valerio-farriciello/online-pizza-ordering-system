//Author: Valerio Farriciello
let url = require('url');
let fs = require('fs');

let isLoggedIn = false;
let customerID;

//I NEED A FUNCTION FROM WHERE I CAN JUST PASS THE OBJECT AND MODIFY THIS GLOBAL VARIABLE BY THE ID MAYBE OR THE ACTUAL OBJECT
let currentCart = {setMenuPizzas : [], sides : [], personalisedPizzas : []};

/*this is a variable that will be updated every time the cart is called, therefore I can add it to the payment object below*/

let currentPrice = 0;
exports.setCurrentPrice = function(price){
  currentPrice = price;
};

/*payment and order obj contain the values to be inserted into the database. Notice that these two object only contains a few values e.g. payment method, name given
* for the collection or delivery etc.
* The reason is that I've decided to centralize everything into the router, therefore it will be its task to call the database then and finalize these two object which
* values will be inserted into the Database*/
exports.setOrderAndPayment = function(paymentObj, orderObj, req, res){
  paymentObj.totalPaid = currentPrice;
  //if the address is not equal to null (so it's for delivery) adds 4 euro (delivery charge)
  if(orderObj.address !== null){
    paymentObj.totalPaid += 4;
  }
  require('./model/dataSource').placeAnOrder(customerID, currentCart, paymentObj, orderObj, function() {
      currentCart = {setMenuPizzas: [], sides: [], personalisedPizzas: []};
      if (orderObj.address === null) {
          message = "YOUR ORDER HAS BEEN PLACE AND IT WILL BE READY FOR COLLECTION IN THE NEXT 10-15 MINUTES";
          require('./controllers/orderPlacedController').get(req, res, isLoggedIn, customerID, message);
      } else {
          message = `YOUR ORDER HAS BEEN PLACE AND IT WILL BE IN ${orderObj.address} IN THE NEXT 40 TO 50 MINUTES.`;
          require('./controllers/orderPlacedController').get(req, res, isLoggedIn, customerID, message);
      }
  });

};


exports.addPizzas = function(setMenuPizzaID){
  currentCart.setMenuPizzas.push(setMenuPizzaID);
};

exports.addSides = function(sideID){
  currentCart.sides.push(sideID);
};

exports.addPersonalisedPizza = function(personalisedPizza){
  currentCart.personalisedPizzas.push(personalisedPizza);
};



exports.get = function(req, res) {
  req.requrl = url.parse(req.url, true);
  let path = req.requrl.pathname;

  if(req.url.match(/.jpg/)){
    let jpgPath = __dirname + "/views/images" + req.requrl.pathname;
    let image = fs.createReadStream(jpgPath);
    res.statusCode = 200;
    res.setHeader("Content-Type", "image/jpg");
    image.pipe(res);
  }
  if(req.url.match(/.css/)){
    let cssPath = __dirname + "/views" + req.requrl.pathname;
    let css = fs.createReadStream(cssPath, "UTF-8");
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/css");
    css.pipe(res);
  }

  let forbiddenPath = ['/style.css',
    '/Americana.jpg',
    '/Empire%20State.jpg',
    '/Smokey%20Joe%20BBQ.jpg',
    '/Hawaiian.jpg',
    '/Veg%20out.jpg',
    '/Wedges.jpg',
    '/Garlic%20Pizza.jpg',
    '/Twister%20Fries.jpg',
    '/Falafel.jpg',
    '/vesuvio.jpg'];
  switch(req.method){
    case "GET":
      if (path === '/') {
        require('./controllers/homeController').get(req, res, isLoggedIn, customerID);
      }
      else if (path === '/cart') {
        require('./controllers/cartController').get(req, res, isLoggedIn, customerID, currentCart);
      }
      else if (path === '/myOrders') {
        require('./controllers/myOrdersController').get(req, res, isLoggedIn, customerID, currentCart);
      }
      else if (path === '/myDetails') {
        require('./controllers/myDetailsController').get(req, res, isLoggedIn, customerID);
      }
      else if (path === '/delivery') {
        require('./controllers/deliveryController').get(req, res, isLoggedIn, customerID);
      }
      else if (path === '/collection') {
        require('./controllers/collectionController').get(req, res, isLoggedIn, customerID);
      }
      else if (path === '/menu') {
        require('./controllers/menuController').get(req, res, isLoggedIn, customerID);
      }
      else if (path === '/personalisedPizzas') {
        require('./controllers/personalisedPizzasController').get(req, res, isLoggedIn, customerID);
      }
      else if (path === '/register') {
        require('./controllers/registerController').get(req, res, isLoggedIn, customerID);
      }
      else if (path === '/login') {
        require('./controllers/loginController').get(req, res, isLoggedIn, customerID);
      }
      else if (path === '/logout') {
        isLoggedIn = false;
        customerID = "";
        //if logs out everything that was in the cart will be deleted
        currentCart = {setMenuPizzas : [], sides : [], personalisedPizzas : []};
        require('./controllers/homeController').get(req, res, isLoggedIn, customerID);
      }
      /*if the path requested is none of the known ones send it to the 404 page, BUT make sure that the "unknown path" is not a
      * jpg or css file otherwise they will not load*/
      else if(!forbiddenPath.includes(path)){
        require('./controllers/notFoundController').get(req, res, isLoggedIn, customerID);
      }

      break;
    case "POST":
      if (path === '/register') {
        require('./controllers/registerController').post(req, res, isLoggedIn, customerID);
      }
      else if (path === '/cart') {
        require('./controllers/cartController').post(req, res, isLoggedIn, customerID, currentCart);
      }
      else if (path === '/collection') {
        require('./controllers/collectionController').post(req, res, isLoggedIn, customerID);
      }
      else if (path === '/delivery') {
        require('./controllers/deliveryController').post(req, res, isLoggedIn, customerID);
      }
      else if (path === '/personalisedPizzas') {
        require('./controllers/personalisedPizzasController').post(req, res, isLoggedIn, customerID);
      }
      else if (path === '/login') {
        require('./controllers/loginController').post(req, res, isLoggedIn, customerID);
      }
      else if (path === '/menu') {
        require('./controllers/menuController').post(req, res, isLoggedIn, customerID);
      }
      break;
  }




 };

exports.login = function(username, req, res){
    isLoggedIn = true;
    customerID = username;
    require('./controllers/homeController').get(req, res, isLoggedIn, customerID);
};
