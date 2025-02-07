const fs = require("fs");

let items = [];
let categories = [];

function initialize() {
    return new Promise((resolve, reject) => {
        fs.readFile("./data/items.json", "utf8", (err, data) => {
            if (err) return reject("Unable to read items file");
            items = JSON.parse(data);
            
            fs.readFile("./data/categories.json", "utf8", (err, data) => {
                if (err) return reject("Unable to read categories file");
                categories = JSON.parse(data);
                resolve();
            });
        });
    });
}

function getAllItems() {
    return new Promise((resolve, reject) => {
        if (items.length > 0) resolve(items);
        else reject("No items found");
    });
}

function getPublishedItems() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published === true);
        if (publishedItems.length > 0) resolve(publishedItems);
        else reject("No published items found");
    });
}

function getCategories() {
    return new Promise((resolve, reject) => {
        if (categories.length > 0) resolve(categories);
        else reject("No categories found");
    });
}

module.exports = { initialize, getAllItems, getPublishedItems, getCategories };
