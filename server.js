/*********************************************************************************
WEB322 – Assignment 03
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part * of this assignment has
been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Sidharth Variyath
Student ID:166987222
Date:05-03-2025
Cyclic Web App URL: https://github.senecapolytechnic.ca/pages/svariyath/WEB322-app/
GitHub Repository URL: https://github.com/SIDGTR/WEB322-APP
********************************************************************************/

const express = require("express");
const path = require("path");
const storeService = require("./store-service");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

const app = express();
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


app.get("/", (req, res) => {
    res.redirect("/about");
});


app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "views/about.html"));
});

app.get("/items/add", (req, res) => {
    res.sendFile(path.join(__dirname, "views/addItem.html"));
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


app.get("/shop", (req, res) => {
    storeService.getPublishedItems()
        .then(items => res.json(items))
        .catch(err => {
            console.error("Error getting published items:", err);  
            res.status(404).json({ message: "No published items found" });
        });
});


app.get("/items", (req, res) => {
    if (req.query.category) {
        storeService.getItemsByCategory(req.query.category)
            .then(items => res.json(items))
            .catch(err => {
                console.error("Error getting items by category:", err);  
                res.status(404).send("No items found for the specified category");
            });
    } else if (req.query.minDate) {
        storeService.getItemsByMinDate(req.query.minDate)
            .then(items => res.json(items))
            .catch(err => {
                console.error("Error getting items by minDate:", err); 
                res.status(404).send("No items found for the specified date");
            });
    } else {
        storeService.getAllItems()
            .then(items => res.json(items))
            .catch(err => {
                console.error("Error getting all items:", err); 
                res.status(404).json({ message: "No items found" });
            });
    }
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
        .then(categories => res.json(categories))
        .catch(err => {
            console.error("Error getting categories:", err);  
            res.status(404).json({ message: "No categories found" });
        });
});


app.use((req, res) => {
    res.status(404).send("Page Not Found");
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
