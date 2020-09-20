//Author: Valerio Farriciello
const sqlite3 = require('sqlite3').verbose();
let date = new Date();
let db = new sqlite3.Database('./model/ValerioFarricielloDatabase.db', (err) => {
    if(err){
        console.log(err.message);
        throw err;
    }
    console.log(`connected to Valerio Farriciello database `);
});

/*-------------------------------------------------------------------------------REGISTER A NEW CUSTOMER------------------------------------------------------------*/
exports.registerACustomer = function(customer, callback) {
    db.all("SELECT * FROM customersDetails", [], (err, rows) => {
        let errorMessage = "";
        let canRegister = true;
        let hasBeenRegistered;
        if (err) {
            throw err;
        }

        //validating username
        if(customer.customerID.length < 6 || customer.customerID.length > 18){
            errorMessage = "ERROR: THE USERNAME HAS TO BE BETWEEN 5 AND 18 CHARACTERS LONG";
            canRegister = false;

        }
        //validating fname and lname
        else if(customer.fname.length < 6 || customer.fname.length > 18 || customer.lname.length < 6 || customer.lname.length > 18){
            errorMessage = "ERROR: THE NAME AND THE LAST NAME HAVE TO BE BETWEEN 5 AND 18 CHARACTERS LONG";
            canRegister = false;
        }
        //validating address
        else if(customer.address.length < 6 || customer.address.length > 50){
            errorMessage = "ERROR: THE ADDRESS HAS TO BE BETWEEN 5 AND 18 CHARACTERS LONG";
            canRegister = false;
        }
        //validating phone number
        else if(customer.phoneNumber.length < 6 || customer.phoneNumber.length > 15){
            errorMessage = "ERROR: PHONE NUMBER NOT VALID";
            canRegister = false;
        }
        //validating email
        else if(customer.email.length < 6 || customer.email.length > 35){
            errorMessage = "ERROR: EMAIL NOT VALID";
            canRegister = false;
        }
        //validating password
        else if(customer.password.length < 6 || customer.password.length > 15){
            errorMessage = "ERROR: THE PASSWORD HAS TO BE BETWEEN 5 AND 18 CHARACTERS LONG";
            canRegister = false;
        }


        //validating if the username has been used already
        rows.forEach((row) => {
            if (row.customerID.toString() === customer.customerID.toString()) {
                errorMessage = "ERROR: THE USERNAME IS ALREADY USED";
                canRegister = false;
            }
        });

        if (canRegister) {
            //serialize otherwise they will run in parallel
            db.serialize(()=>{
                db.run("INSERT INTO customersDetails VALUES ('" + customer.customerID + "', '" + customer.fname + "', '" + customer.lname + "', '" + customer.address + "', '" + customer.phoneNumber + "')");
                db.run("INSERT INTO registration VALUES ('" + customer.customerID + "', '" + customer.email + "', '" + customer.password + "')");
                hasBeenRegistered = true;
                callback(hasBeenRegistered, errorMessage);
            });
        }
        else{
            hasBeenRegistered = false;
            callback(hasBeenRegistered, errorMessage);
        }
    });
};





/*-------------------------------------------------------------------------------LOG IN------------------------------------------------------------*/

exports.login = function(customerID, password, callback) {
    db.all("SELECT * FROM registration", [], (err, rows) => {
        let canLogIn = false;
        if (err) {
            throw err;
        }

        rows.forEach((row) => {
            if ((row.customerID.toString() === customerID.toString()) && (row.password.toString() === password)) {
                canLogIn = true;
            }
        });

        callback(canLogIn);

    });
};
/*-------------------------------------------------------------------------------GET THE PIZZAS AND SIDES------------------------------------------------------------*/
exports.getPizzasAndSides = function(callback){
    let setMenuPizzas, sides;
    db.all(`SELECT * FROM setMenuPizzas`, [], (err, rows) => {
        if (err) {
            throw err;
        }
        setMenuPizzas = rows;
        db.all(`SELECT * FROM sides`, [], (err, rows) => {
            if (err) {
                throw err;
            }
            sides = rows;
            callback(setMenuPizzas, sides);
        });
    });
};
/*-------------------------------------------------------------------------GETTING TOPPINGS--------------------------------------------------------------------------*/

exports.getToppings = function(callback){
    let toppings;
    db.all("SELECT * FROM toppings", [], (err, rows) => {
        if (err) {
            throw err;
        }
        toppings = rows;
        callback(toppings);
    });
};



/*------------------------------------------------------------ADD A NEW INSTANCE OF ORDER------------------------------------------------------------*/


exports.placeAnOrder = function(customerID, currentCart, payment, order, callback) {
    db.all("SELECT * FROM orders", [], (err, rows) => {
        if (err) {
            throw err;
        }
        let max = -1;
        /*I'm basically taking the digits that represent a number from the orderID e.g. OR1 - OR2 etc.
        * By checking all of them and converting the last digit into a number I will have the unique order ID for the next order*/
        for (let i = 0; i < rows.length; i++) {
            let valueToCheck = +rows[i].orderID.substring(2);
            if (valueToCheck > max) max = valueToCheck;
        }


        //I'm creating an array that stores the set menu pizzas and sides ordered by the customer with the corresponding quantity
        let setMenuPizzas, sides;
        let currentOrders = [
            setMenuPizzas = {itemID: [], qty: []},
            sides = {itemID: [], qty: []}
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
        //increasing the value max for the next order ID
        max++;
        order.orderID = "OR" + max;

        //if the address is null (collection) there is no need of email and address
        if(order.address === null){
            db.run(`INSERT INTO orders VALUES ('${order.orderID}', '${customerID}', '${order.name}', null,
         '${order.phoneNumber}', null, '${date.getFullYear()}/${(date.getMonth()+1)}/${date.getDate()}')`);
        }
        //if it is for delivery there is the need of an address, but not for an email
        else{
            if(order.email === null) {
                order.email = "null"
            }else order.email = `'${order.email}'`;

            db.run(`INSERT INTO orders VALUES ('${order.orderID}', '${customerID}', '${order.name}', '${order.address}',
            '${order.phoneNumber}', ${order.email}, '${date.getFullYear()}/${(date.getMonth()+1)}/${date.getDate()}')`);
        }


        db.all("SELECT * FROM customizedOrders", [], (err, rows) => {
            if (err) {
                throw err;
            }
            let personalisedOrders = rows;

            let maxForPizzaID = -1;
            /*I'm basically taking the digits that represent a number from the customizedPizzaID e.g. CO1 - CO2 etc.
            * By checking all of them and converting the last digit into a number I will have the unique customizedPizza ID for the next order*/
            for (let i = 0; i < personalisedOrders.length; i++) {
                let valueToCheck = + personalisedOrders[i].customizedPizzaID.substring(2);
                if (valueToCheck > maxForPizzaID) maxForPizzaID = valueToCheck;
            }


            //with the index 0 I'm refering to the pizzas object
            for (let i = 0; i < currentOrders[0].itemID.length; i++) {
                db.run(`INSERT INTO setMenuPizzasOrders VALUES ('${currentOrders[0].itemID[i]}', '${order.orderID}', '${currentOrders[0].qty[i]}')`);
            }

            for (let i = 0; i < currentOrders[1].itemID.length; i++) {
                db.run(`INSERT INTO sidesOrders VALUES ('${currentOrders[1].itemID[i]}', '${order.orderID}', '${currentOrders[1].qty[i]}')`);
            }
            if(payment.paymentMethod === "cash"){
                //if payment is in cash there is no need to specify the card number, expiry date and cvv
                db.run(`INSERT INTO payments VALUES ('${payment.paymentID}', '${order.orderID}', '${payment.paymentMethod}',
             null, null, null, '${payment.totalPaid}')`);
            }
            else{
                db.run(`INSERT INTO payments VALUES ('${payment.paymentID}', '${order.orderID}', '${payment.paymentMethod}',
             '${payment.cardNumber}', '${payment.expiry}', '${payment.cvv}', '${payment.totalPaid}')`);
            }


            maxForPizzaID++;
            for (let i = 0; i < currentCart.personalisedPizzas.length; i++) {
                let customizedPizzaID = 'CP' + maxForPizzaID++;
                //inserting the values into the customized order table in the database
                db.run(`INSERT INTO customizedOrders VALUES ('${customizedPizzaID}', '${order.orderID}', '${currentCart.personalisedPizzas[i].crustFlavor}', '${currentCart.personalisedPizzas[i].crustSize}', '${currentCart.personalisedPizzas[i].sauce}', '${currentCart.personalisedPizzas[i].quantity}')`);

                //adding the toppings of that pizza in the toppingsOnItem table

                //if in the current pizza the user selected at least one topping (not counting the cheese)
                if(typeof currentCart.personalisedPizzas[i].toppingID !== "undefined"){
                    //if it is only one topping it is considered as a string
                    if (typeof currentCart.personalisedPizzas[i].toppingID === "string"){
                        db.run(`INSERT INTO toppingsOnItem VALUES('${customizedPizzaID}', '${currentCart.personalisedPizzas[i].toppingID}')`);
                    }
                    else{
                        //if there is more than one topping then it is considered as an array
                        for(let j = 0; j < currentCart.personalisedPizzas[i].toppingID.length; j++){
                            db.run(`INSERT INTO toppingsOnItem VALUES('${customizedPizzaID}', '${currentCart.personalisedPizzas[i].toppingID[j]}')`);
                        }
                    }
                }

                /*if the user didn't select No Cheese (nc) add the corresponding topping into the toppings on item table (which can be either cheese (c) or double
                * cheese (cc) */
                if(currentCart.personalisedPizzas[i].cheese !== 'nc'){
                    db.run(`INSERT INTO toppingsOnItem VALUES('${customizedPizzaID}', '${currentCart.personalisedPizzas[i].cheese}')`);
                }
            }




            callback();
        });

    });
};


/*------------------------------------------------------------GETTING THE PAYMENTS DETAILS------------------------------------------------------------*/
//getting all the payments in order to set the next payment ID
exports.getPayments = function(callback){
    db.all("SELECT * FROM payments", [], (err, rows) => {
        if (err) {
            throw err;
        }
        let max = 0;
        /*I'm basically taking the digits that represent a number from the paymentID e.g. PM1 - PM2 etc.
        * By checking all of them and converting the last digit into a number I will have the unique payment ID for the next payment*/
        for (let i = 0; i < rows.length; i++) {
            let valueToCheck = + rows[i].paymentID.substring(2);
            if (valueToCheck > max) max = valueToCheck;
        }
        max++;
        callback(max);
    });
};

/*------------------------------------------------------------RETRIEVE ORDERS DETAILS------------------------------------------------------------*/

exports.getOrdersByAUser = function (customerID, callback) {
    let ordersAndPayments;
    let orders, allPayments, allOrderedPizzas, allOrderedSides, allOrderedPersonalisedPizzas = [];
    let allSetMenuPizzas, allSides, toppings, toppingsOnItem;
    db.all(`SELECT * FROM orders WHERE customerID = '${customerID}'`, [], (err, rows) => {
        if (err) {
            throw err;
        }
        orders = rows;
        db.all(`SELECT * FROM payments`, [], (err, rows) => {
            if (err) {
                throw err;
            }
            allPayments = rows;

            db.all(`SELECT * FROM setMenuPizzasOrders`, [], (err, rows) => {
                if (err) {
                    throw err;
                }

                allOrderedPizzas = rows;


                db.all(`SELECT * FROM sidesOrders`, [], (err, rows) => {
                    if (err) {
                        throw err;
                    }

                    allOrderedSides = rows;



                    ordersAndPayments = {orders: [],
                        payments: [],
                        setMenuPizzas: [],
                        sides : [],
                        cyo : [] //(choose your own) personalised pizzas
                    };




                    //I'm getting all the orders and corresponding payments (stored in one object) that belongs to the same customer
                    for (let i = 0; i < orders.length; i++) {
                        //reset these objects every time since they contain unique values per order
                        let singleOrderSetMenuPizzas = {item: [], quantity: []};
                        let singleOrderSides = {item: [], quantity : []};


                        ordersAndPayments.orders.push(orders[i]);

                        //FOR EVERY ORDER:

                        //get payment
                        for (let j = 0; j < allPayments.length; j++) {
                            if (orders[i].orderID === allPayments[j].orderID) {
                                ordersAndPayments.payments.push(allPayments[j]);
                                break;
                            }
                        }

                        //get pizzas ordered
                        for(let j = 0; j < allOrderedPizzas.length; j++){
                            if (orders[i].orderID === allOrderedPizzas[j].orderID) {
                                singleOrderSetMenuPizzas.item.push(allOrderedPizzas[j].setMenuPizzaID);
                                singleOrderSetMenuPizzas.quantity.push(allOrderedPizzas[j].quantity);
                            }
                        }
                        //adding the object that contains the set menu pizzas for that specific order
                        ordersAndPayments.setMenuPizzas.push(singleOrderSetMenuPizzas);


                        //get sides ordered
                        for(let j = 0; j < allOrderedSides.length; j++){
                            if (orders[i].orderID === allOrderedSides[j].orderID) {
                                singleOrderSides.item.push(allOrderedSides[j].sideID);
                                singleOrderSides.quantity.push(allOrderedSides[j].quantity);
                            }
                        }
                        //adding the object that contains the sides for that specific order
                        ordersAndPayments.sides.push(singleOrderSides);
                    }



                    //CONVERTING ALL THE ITEM ID INTO ACTUAL NAMES:

                    db.all(`SELECT * FROM setMenuPizzas`, [], (err, rows) => {
                        if (err) {
                            throw err;
                        }

                        allSetMenuPizzas = rows;

                        db.all(`SELECT * FROM sides`, [], (err, rows) => {
                            if (err) {
                                throw err;
                            }

                            allSides = rows;


                            //FOR EVERY ORDER AGAIN
                            for(let i = 0; i < ordersAndPayments.orders.length; i++ ){

                                //for every set of set menu pizzas that the user ordered on THAT SPECIFIC orderID
                                for(let j = 0; j < ordersAndPayments.setMenuPizzas[i].item.length; j++){
                                    //check all the pizzas
                                    for(let k = 0; k < allSetMenuPizzas.length; k++){
                                        if(allSetMenuPizzas[k].setMenuPizzaID === ordersAndPayments.setMenuPizzas[i].item[j]){
                                            ordersAndPayments.setMenuPizzas[i].item[j] = allSetMenuPizzas[k].name;
                                            break; //break because there is only one instance per table of the pizzaID
                                        }
                                    }
                                }

                                //for every set of side that the user ordered on THAT SPECIFIC orderID
                                for(let j = 0; j < ordersAndPayments.sides[i].item.length; j++){
                                    //check all the sides
                                    for(let k = 0; k < allSides.length; k++){
                                        if(allSides[k].sideID === ordersAndPayments.sides[i].item[j]){
                                            ordersAndPayments.sides[i].item[j] = allSides[k].name;
                                            break; //break because there is only one instance per table of the sideID
                                        }
                                    }
                                }

                            }


                            //GETTING PERSONALIZED PIZZAS
                            db.all(`SELECT * FROM customizedOrders`, [], (err, rows) => {
                                if (err) {
                                    throw err;
                                }

                                allOrderedPersonalisedPizzas = rows;

                                //GETTING ALL THE TOPPINGS
                                db.all("SELECT * FROM toppings", [], (err, rows) => {
                                    if (err) {
                                        throw err;
                                    }

                                    toppings = rows;

                                    db.all("SELECT * FROM toppingsOnItem", [], (err, rows) => {
                                        if (err) {
                                            throw err;
                                        }
                                        //all the toppings that have been ordered on all the pizzas
                                        toppingsOnItem = rows;



                                        for(let i = 0; i < ordersAndPayments.orders.length; i++ ) {

                                            let singlePersonalisedPizzas = {
                                                pizzaID : [],
                                                crustFlavor: [],
                                                crustSize: [],
                                                sauce: [],
                                                quantity: [],
                                                toppings : []
                                            };

                                            for(let j = 0; j < allOrderedPersonalisedPizzas.length; j++){
                                                if(ordersAndPayments.orders[i].orderID === allOrderedPersonalisedPizzas[j].orderID){
                                                    singlePersonalisedPizzas.pizzaID.push(allOrderedPersonalisedPizzas[j].customizedPizzaID);

                                                    let pizzaIDToCheck = allOrderedPersonalisedPizzas[j].customizedPizzaID;
                                                    let selectedToppings = [];
                                                    //getting the toppings for that specific pizza
                                                    for(let k = 0; k < toppingsOnItem.length; k++){
                                                        if(pizzaIDToCheck === toppingsOnItem[k].customizedPizzaID){
                                                            //translating the topping ID into topping name
                                                            for(let t = 0; t < toppings.length; t++){
                                                                if(toppings[t].toppingID === toppingsOnItem[k].toppingID){
                                                                    selectedToppings.push(toppings[t].name);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    singlePersonalisedPizzas.crustFlavor.push(allOrderedPersonalisedPizzas[j].crustFlavor);
                                                    singlePersonalisedPizzas.crustSize.push(allOrderedPersonalisedPizzas[j].crustSize);
                                                    singlePersonalisedPizzas.sauce.push(allOrderedPersonalisedPizzas[j].sauce);
                                                    singlePersonalisedPizzas.quantity.push(allOrderedPersonalisedPizzas[j].quantity);
                                                    singlePersonalisedPizzas.toppings.push(selectedToppings);
                                                }
                                            }
                                            ordersAndPayments.cyo.push(singlePersonalisedPizzas);

                                        }



                                        callback(ordersAndPayments);

                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};



/*------------------------------------------------------GETTING CUSTOMER DETAILS----------------------------*/
exports.getCustomerDetails = function (customerID, callback) {
    let customerDetails = {fname: "", lname: "", address: "", email: ""};
    db.all(`SELECT * FROM customersDetails WHERE customerID = '${customerID}'`, [], (err, rows) => {
        if (err) {
            throw err;
        }

        customerDetails.fname = rows[0].fname;
        customerDetails.lname = rows[0].lname;
        customerDetails.address = rows[0].address;

        db.all(`SELECT * FROM registration WHERE customerID = '${customerID}'`, [], (err, rows) => {
            if (err) {
                throw err;
            }
            customerDetails.email = rows[0].email;

            callback(customerDetails);

        });
    });
};