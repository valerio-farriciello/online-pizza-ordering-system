//Author: Valerio Farriciello
const ejs = require('ejs');
const cart_path = './views/pages/cart.ejs';
const { parse } = require('querystring');

exports.get = function(req, res, isLoggedIn, customerID, currentCart) {
    require('../model/dataSource').getPizzasAndSides(function (setMenuPizzasDB, sidesDB) {
        let totalPrice = 0;
        let setMenuPizzas, sides, personalisedPizzas;
        let cyo = currentCart.personalisedPizzas;


        let currentOrders = [
            setMenuPizzas = {itemID: [], itemName: [], qty: [], price: []},
            sides = {itemID: [], itemName: [], qty: [], price: []},
            personalisedPizzas = {crustSize: [], crustFlavor: [], cheese: [],  toppings: [], sauce: [],
                quantity: [], price: []}
        ];

        //now I will set the id and quantity for the pizzas without duplications
        for(let i = 0; i < currentCart.setMenuPizzas.length; i++){
            let currentPizzaID = currentCart.setMenuPizzas[i];
            if(!setMenuPizzas.itemID.includes(currentPizzaID)){
                let qty = 0;
                for(let j = 0; j < currentCart.setMenuPizzas.length; j++){
                    if(currentCart.setMenuPizzas[j] === currentPizzaID){
                        qty++;
                    }
                }
                setMenuPizzas.itemID.push(currentPizzaID);
                setMenuPizzas.qty.push(qty);
            }
        }
        //now I will set the id and quantity for the sides without duplications
        for(let i = 0; i < currentCart.sides.length; i++){
            let currentSideID = currentCart.sides[i];
            if(!sides.itemID.includes(currentSideID)){
                let qty = 0;
                for(let j = 0; j < currentCart.sides.length; j++){
                    if(currentCart.sides[j] === currentSideID){
                        qty++;
                    }
                }
                sides.itemID.push(currentSideID);
                sides.qty.push(qty);
            }
        }

        for(let i = 0; i < setMenuPizzas.itemID.length; i++){
            for(let j = 0; j < setMenuPizzasDB.length; j++){
                if(setMenuPizzas.itemID[i] === setMenuPizzasDB[j].setMenuPizzaID){
                    setMenuPizzas.itemName.push(setMenuPizzasDB[j].name);
                    setMenuPizzas.price.push(setMenuPizzasDB[j].price);
                    totalPrice += (setMenuPizzasDB[j].price * setMenuPizzas.qty[i]);
                    break;
                }
            }
        }
        for(let i = 0; i < sides.itemID.length; i++){
            for(let j = 0; j < sidesDB.length; j++){
                if(sides.itemID[i] === sidesDB[j].sideID){
                    sides.itemName.push(sidesDB[j].name);
                    sides.price.push(sidesDB[j].price);
                    totalPrice += (sidesDB[j].price * sides.qty[i]);
                    break;
                }
            }
        }

        require('../model/dataSource').getToppings(function (toppings) {
            /*this small line is for debugging purposes:
            * if (for any reason) right after the log in the user wants to access into the cart (that contains 0 element) the server doesn't have enough
            * time to initialize 'currentCart.personalisedPizzas' which is an array that stores the current personalised pizza, therefore the for loop below
            * will try to read the length of undefined. In order to avoid it I will temporary set the cyo as an empty array (this will not affect the
            * actual order since if a user just logged in the cart will always be empty)*/
            if(typeof cyo === "undefined") cyo = [];



            for(let i = 0; i < cyo.length; i++) {
                let cyoPrice = 10;
                let cyoToppings = '';
                /*---------GETTING THE CRUST SIZE FOR DISPLAY-----------------------*/
                personalisedPizzas.crustSize.push(cyo[i].crustSize);
                /*---------GETTING THE CRUST FLAVOR FOR DISPLAY-----------------------*/
                personalisedPizzas.crustFlavor.push(cyo[i].crustFlavor);

                /*---------GETTING THE CHEESE FOR DISPLAY-----------------------*/
                if (cyo[i].cheese === "nc") {
                    personalisedPizzas.cheese.push("No cheese");
                } else {
                    for (let j = 0; j < toppings.length; j++) {
                        if (toppings[j].toppingID === cyo[i].cheese) {
                            personalisedPizzas.cheese.push(toppings[j].name);
                            cyoPrice += toppings[j].price;
                            break;
                        }
                    }
                }

                /*---------GETTING THE TOPPINGS FOR DISPLAY-----------------------*/
                if (typeof cyo[i].toppingID !== "undefined"){
                //making sure that it is an array of toppings
                    if (typeof cyo[i].toppingID === "string") {
                        let tempValue = cyo[i].toppingID;
                        cyo[i].toppingID = [];
                        cyo[i].toppingID.push(tempValue);
                    }

                    for (let j = 0; j < cyo[i].toppingID.length; j++) {
                        for (let k = 0; k < toppings.length; k++) {
                            if (cyo[i].toppingID[j] === toppings[k].toppingID) {
                                cyoToppings += `${toppings[k].name} `;
                                cyoPrice += toppings[k].price;
                                break;
                            }
                        }
                    }
                    personalisedPizzas.toppings.push(cyoToppings);
                }
                else{
                    personalisedPizzas.toppings.push("NO TOPPINGS");
                }

                /*---------GETTING THE SAUCE FOR DISPLAY-----------------------*/
                personalisedPizzas.sauce.push(cyo[i].sauce);

                /*---------GETTING THE QUANTITY FOR DISPLAY-----------------------*/
                personalisedPizzas.quantity.push(cyo[i].quantity);

                /*---------GETTING THE CURRENT PERSONAL PIZZA PRICE FOR DISPLAY-----------------------*/
                cyoPrice = cyoPrice * cyo[i].quantity;
                personalisedPizzas.price.push(cyoPrice);

                totalPrice += cyoPrice;
            }

            //updates the current price into the router
            require('../router').setCurrentPrice(totalPrice);

            ejs.renderFile(cart_path, {totalPrice : totalPrice, currentOrders : currentOrders, customerID : customerID, isLoggedIn : isLoggedIn}, (err, data) => {
                //console.log(err || data);
                res.end(data);
            });
        });

    });
};



exports.post = function(req, res, isLoggedIn, customerID, currentCart) {
    body = '';

    req.on('data', function (chunk) {
        body += chunk.toString();
    });

    req.on('end', function () {
        let itemsToDelete = parse(body);

        if(typeof itemsToDelete.itemID !== "undefined"){
            /*if the user selects only one item to delete, the attribute itemID inside the object itemsToDelete will be considered as a string. Since I need
        * an array in order to modify the current cart object, I'm making sure that the attribute itemID will be an array that contains the value to delete*/
            if(typeof itemsToDelete.itemID === "string"){
                let tempValue = itemsToDelete.itemID;
                itemsToDelete.itemID = [];
                itemsToDelete.itemID.push(tempValue);
            }
            for(let i = 0; i < itemsToDelete.itemID.length; i++){
                //check in the set menu pizzas first
                for(let j = 0; j < currentCart.setMenuPizzas.length; j++){
                    if(itemsToDelete.itemID[i] === currentCart.setMenuPizzas[j]){
                        currentCart.setMenuPizzas.splice(j, 1);
                        j--;
                    }
                }
                for(let j = 0; j < currentCart.sides.length; j++){
                    //then check in the sides
                    if(itemsToDelete.itemID[i] === currentCart.sides[j]){
                        currentCart.sides.splice(j, 1);
                        j--;
                    }
                }
            }
        }

        if(typeof itemsToDelete.personalisedPizzaIndex !== "undefined"){
            if(typeof itemsToDelete.personalisedPizzaIndex === "string"){
                let tempValue = itemsToDelete.personalisedPizzaIndex;
                itemsToDelete.personalisedPizzaIndex = [];
                itemsToDelete.personalisedPizzaIndex.push(tempValue);
            }
            for(let i = 0; i < itemsToDelete.personalisedPizzaIndex.length; i++){
                let indexToRemove = + itemsToDelete.personalisedPizzaIndex[i];
                currentCart.personalisedPizzas.splice(indexToRemove, 1);
            }
        }


        //sends the user back to the same (updated) page
        req.method = "GET";
        require('../router').get(req, res);
    });
};

