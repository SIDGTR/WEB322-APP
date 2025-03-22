/*********************************************************************************
WEB322 – Assignment 04
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part * of this assignment has
been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Sidharth Variyath
Student ID: 166987222
Date: 21-03-2025
Cyclic Web App URL: https://github.senecapolytechnic.ca/pages/svariyath/WEB322-app/
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

const app = express();

// Setup handlebars
const hbs = exphbs.create({
    extname: '.hbs',
    helpers: {
        navLink: function(url, options) {
            return '<li' + 
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        },
        safeHTML: function(context) {
            return new Handlebars.SafeString(context);
        }
    }
});

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');

const PORT = process.env.PORT || 8080;

// Configure Cloudinary
cloudinary.config({
    cloud_name: "dhiraqdft", 
    api_key: "646929591171222",  
    api_secret: "Gdflve-4yxR2Y_i14GcHOV5-NRk",
    secure: true
});

const upload = multer();

app.use(express.static("public"));

// Add middleware for active route and viewing category
app.use(function(req,res,next){
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

app.get("/", (req, res) => {
    res.redirect("/shop");
});

app.get("/about", (req, res) => {
    res.render("about", { pageTitle: "About" });
});

app.get("/items/add", (req, res) => {
    res.render("addItem", { pageTitle: "Add Item" });
});

app.post("/items/add", upload.single("featureImage"), (req, res) => {
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
        }).catch(err => {
            console.error("Cloudinary upload error:", err);  
            return res.status(500).send("Failed to upload image to Cloudinary");
        });
    } else {
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;
        storeService.addItem(req.body).then(() => {
            res.redirect("/items");
        }).catch(err => {
            console.error("Error adding item to store:", err);  
            res.status(500).send("Unable to add item to the store");
        });
    }
});

app.get("/shop", async (req, res) => {
    let viewData = {};

    try{
        let items = [];

        if(req.query.category){
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        }else{
            items = await storeService.getPublishedItems();
        }

        items.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));
        viewData.items = items;
        viewData.item = items[0];

    }catch(err){
        viewData.message = "no results";
    }

    try{
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results";
    }

    res.render("shop", {data: viewData, pageTitle: "Shop"});
});

app.get('/shop/:id', async (req, res) => {
    let viewData = {};

    try {
        let items = [];

        if(req.query.category){
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            items = await storeService.getPublishedItems();
        }

        items.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

        viewData.items = items;

        viewData.item = await storeService.getItemById(req.params.id);

    } catch(err) {
        viewData.message = "no results";
    }

    try {
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch(err) {
        viewData.categoriesMessage = "no results"
    }

    res.render("shop", {data: viewData, pageTitle: "Shop"});
});

app.get("/items", (req, res) => {
    let getItems;
    if (req.query.category) {
        getItems = storeService.getItemsByCategory(req.query.category);
    } else if (req.query.minDate) {
        getItems = storeService.getItemsByMinDate(req.query.minDate);
    } else {
        getItems = storeService.getAllItems();
    }

    getItems.then(items => {
        res.render("items", {items: items, pageTitle: "Items"});
    }).catch(err => {
        res.render("items", {message: "no results", pageTitle: "Items"});
    });
});

app.get("/item/:id", (req, res) => {
    storeService.getItemById(req.params.id)
        .then(item => res.json(item))
        .catch(err => {
            console.error("Error getting item by ID:", err);  
            res.status(404).send("Item not found");
        });
});

app.get("/categories", (req, res) => {
    storeService.getCategories()
        .then(categories => {
            res.render("categories", {categories: categories, pageTitle: "Categories"});
        })
        .catch(err => {
            res.render("categories", {message: "no results", pageTitle: "Categories"});
        });
});

app.use((req, res) => {
    res.status(404).render("404", { pageTitle: "Page Not Found" });
});

storeService.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Express http server listening on port ${PORT}`); 
        });
    })
    .catch(err => {
        console.error("Failed to initialize store service:", err);
    });
