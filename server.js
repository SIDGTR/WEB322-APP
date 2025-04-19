/*********************************************************************************
WEB322 – Assignment 06
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part * of this assignment has
been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Sidharth Variyath
Student ID: 166987222
Date: 18-04-2025
Cyclic Web App URL: https://web322-app-9i25.onrender.com/shop
GitHub Repository URL: https://github.com/SIDGTR/WEB322-APP
********************************************************************************/

const express = require("express");
const path = require("path");
const storeService = require("./store-service");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const exphbs = require('express-handlebars');
const Handlebars = require('handlebars');
const authData = require('./auth-service');
const clientSessions = require('client-sessions');
const bcrypt = require('bcryptjs'); 

const app = express();
const PORT = process.env.PORT || 8080;

cloudinary.config({
    cloud_name: "dhiraqdft",
    api_key: "646929591171222",
    api_secret: "Gdflve-4yxR2Y_i14GcHOV5-NRk",
    secure: true
});
const upload = multer();

app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
        navLink: function(url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                '><a href="' + url + '" class="nav-link">' + options.fn(this) + '</a></li>';
        },
        equal: function(lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        },
        safeHTML: function(html) {
            return new Handlebars.SafeString(html);
        },
        formatDate: function(dateObj) {
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
        }
    }
}));

app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

app.use(clientSessions({
    cookieName: "session",
    secret: "your_secret_key_here",
    duration: 2 * 60 * 60 * 1000,
    activeDuration: 1000 * 60 * 20
}));

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});


const ensureLogin = (req, res, next) => {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
};

app.get("/", (req, res) => {
    res.redirect("/shop");
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {  
    if (req.body.password !== req.body.password2) {
        return res.render('register', {
            errorMessage: 'Passwords do not match',
            userName: req.body.userName
        });
    }

    try {
        const hash = await bcrypt.hash(req.body.password, 10);
        req.body.password = hash;  
        await authData.registerUser(req.body);  

        res.render('register', {
            successMessage: "User created",
            userName: req.body.userName 
        });
    } catch (err) {
        res.render('register', {
            errorMessage: err,
            userName: req.body.userName 
        });
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent');

    authData.checkUser(req.body)
        .then(user => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };
            res.redirect('/items');
        })
        .catch(err => res.render('login', {
            errorMessage: err,
            userName: req.body.userName
        }));
});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory");
});

app.get("/items/add",ensureLogin, (req, res) => {
    storeService.getCategories()
        .then(categories => res.render("addItem", { categories }))
        .catch(() => res.render("addItem", { categories: [] }));
});

app.post("/items/add",ensureLogin, upload.single("featureImage"), (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            return result;
        }

        upload(req).then((uploaded) => {
            processItem(uploaded.url);
        });
    } else {
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;
        storeService.addItem(req.body).then(() => {
            res.redirect("/items");
        }).catch(() => {
            res.status(500).send("Unable to add item");
        });
    }
});

app.get("/items",ensureLogin, (req, res) => {
    if (req.query.category) {
        storeService.getItemsByCategory(req.query.category)
            .then(items => res.render("items", { items }))
            .catch(() => res.render("items", { message: "No results found for this category." }));
    } else if (req.query.minDate) {
        storeService.getItemsByMinDate(req.query.minDate)
            .then(items => res.render("items", { items }))
            .catch(() => res.render("items", { message: "No results found for this date." }));
    } else {
        storeService.getAllItems()
            .then(items => res.render("items", { items }))
            .catch(() => res.render("items", { message: "No items found." }));
    }
});

// Delete item
app.get("/items/delete/:id",ensureLogin, (req, res) => {
    storeService.deletePostById(req.params.id)
        .then(() => res.redirect("/items"))
        .catch(() => res.status(500).send("Unable to Remove Post / Post not found"));
});

// Categories view
app.get("/categories",ensureLogin, (req, res) => {
    storeService.getCategories()
        .then(categories => res.render("categories", { categories }))
        .catch(() => res.render("categories", { message: "no results" }));
});

// Add Category form
app.get("/categories/add",ensureLogin, (req, res) => {
    res.render("addCategory");
});

app.post("/categories/add",ensureLogin, (req, res) => {
    storeService.addCategory(req.body)
        .then(() => res.redirect("/categories"))
        .catch(() => res.status(500).send("Unable to add category"));
});

// Delete Category
app.get("/categories/delete/:id",ensureLogin, (req, res) => {
    storeService.deleteCategoryById(req.params.id)
        .then(() => res.redirect("/categories"))
        .catch(() => res.status(500).send("Unable to Remove Category / Category not found"));
});

// Shop
app.get("/shop", async (req, res) => {
    let viewData = {};

    try {
        let items = req.query.category
            ? await storeService.getPublishedItemsByCategory(req.query.category)
            : await storeService.getPublishedItems();

        items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
        viewData.items = items;
        viewData.item = viewData.items[0];
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        viewData.categories = await storeService.getCategories();
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }

    res.render("shop", { data: viewData });
});

// Shop Item Details
app.get('/shop/:id', async (req, res) => {
    let viewData = {};

    try {
        let items = req.query.category
            ? await storeService.getPublishedItemsByCategory(req.query.category)
            : await storeService.getPublishedItems();

        items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
        viewData.items = items;
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        viewData.item = await storeService.getItemById(req.params.id);
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        viewData.categories = await storeService.getCategories();
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }

    res.render("shop", { data: viewData });
});

// 404
app.use((req, res) => {
    res.status(404).render("404");
});

// Start Server
storeService.initialize()
    .then(authData.initialize)
    .then(() => app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`)))
    .catch(err => console.log(`Failed to initialize store service: ${err}`));
