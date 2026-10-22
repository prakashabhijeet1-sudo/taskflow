// ===============================
// CART
// ===============================

function addToCart(name, price) {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    let product = {
        name: name,
        price: price
    };

    cart.push(product);

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    alert(name + " added to cart!");

}


// ===============================
// DISPLAY CART
// ===============================

function displayCart() {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    let cartItems =
        document.getElementById("cartItems");

    let total = 0;


    if (cart.length === 0) {

        cartItems.innerHTML =
            "<h3>Your cart is empty.</h3>";

        document.getElementById("cartTotal")
            .innerText = "0";

        return;
    }


    cartItems.innerHTML = "";


    cart.forEach(function(product, index) {

        total += product.price;


        let item =
            document.createElement("div");

        item.className = "cart-item";


        item.innerHTML = `

            <div>

                <h3>${product.name}</h3>

                <p>₹${product.price}</p>

            </div>

            <button
                onclick="removeFromCart(${index})">

                Remove

            </button>

        `;


        cartItems.appendChild(item);

    });


    document.getElementById("cartTotal")
        .innerText = total;

}


// ===============================
// REMOVE FROM CART
// ===============================

function removeFromCart(index) {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];


    cart.splice(index, 1);


    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    displayCart();

}


// ===============================
// CHECKOUT
// ===============================

function checkout() {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];


    if (cart.length === 0) {

        alert("Your cart is empty!");

        return;
    }


    alert(
        "Order placed successfully!"
    );


    localStorage.removeItem("cart");

    displayCart();

}


// ===============================
// SEARCH
// ===============================

function searchProducts() {

    let input =
        document.getElementById(
            "searchInput"
        ).value.toLowerCase();
    let products =
        document.querySelectorAll(
            ".product-card"
        );
    products.forEach(function(product) {
        let name =
            product
            .querySelector("h3")
            .innerText
            .toLowerCase();
        if (name.includes(input)) {

            product.style.display =
                "block";

        } else {

            product.style.display =
                "none";

        }

    });

}


// ===============================
// LOGIN
// ===============================

function login(event) {

    event.preventDefault();


    let email =
        document.getElementById(
            "email"
        ).value;


    let password =
        document.getElementById(
            "password"
        ).value;


    if (email && password) {

        localStorage.setItem(
            "loggedIn",
            "true"
        );


        alert(
            "Login successful!"
        );


        window.location.href =
            "index.html";

    }

}