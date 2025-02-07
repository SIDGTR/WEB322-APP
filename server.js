/*********************************************************************************
WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part * of this assignment has
been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: SIDHARTH VARIYATH
Student ID: 166987222
Date: 05-02-2025
Cyclic Web App URL:
GitHub Repository URL: https://github.senecapolytechnic.ca/svariyath/WEB322-app.git
********************************************************************************/


const express = require("express");
const app = express();

const path = require("path");
const storeService = require("./store-service");

const PORT = process.env.PORT || 8080;

app.use(express.static("public")); 

app.get("/", (req, res) => {
    res.redirect("/about");
});

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "about.html"));
});

app.get("/shop", (req, res) => {
    storeService.getPublishedItems()
        .then(items => res.json(items))
        .catch(err => res.json({ message: err }));
});

app.get("/items", (req, res) => {
    storeService.getAllItems()
        .then(items => res.json(items))
        .catch(err => res.json({ message: err }));
});

app.get("/categories", (req, res) => {
    storeService.getCategories()
        .then(categories => res.json(categories))
        .catch(err => res.json({ message: err }));
});

app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

// Initialize and start server
storeService.initialize().then(() => {
    app.listen(PORT, () => {
        console.log(`Express http server listening on port ${PORT}`);
    });
}).catch(err => {
    console.error("Failed to start server:", err);
});
