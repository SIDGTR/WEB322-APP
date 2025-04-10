const Sequelize = require('sequelize');

const sequelize = new Sequelize('postgresql://neondb_owner:npg_naMDuet6fYp9@ep-yellow-lake-a5cwpnvn-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require', {
    dialect: 'postgres',
    dialectOptions: {
      ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
  });
  


const Item = sequelize.define("Item", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE
});

const Category = sequelize.define("Category", {
  category: Sequelize.STRING
});

Item.belongsTo(Category, { foreignKey: 'category' });

const { Op } = Sequelize;

module.exports.initialize = () => {
  return new Promise((resolve, reject) => {
    sequelize.sync().then(() => {
      resolve();
    }).catch(() => {
      reject("unable to sync the database");
    });
  });
};

module.exports.getAllItems = () => {
  return new Promise((resolve, reject) => {
    Item.findAll()
      .then(data => resolve(data))
      .catch(() => reject("no results returned"));
  });
};

module.exports.getItemsByCategory = (category) => {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: { category: category }
    })
      .then(data => resolve(data))
      .catch(() => reject("no results returned"));
  });
};

module.exports.getItemsByMinDate = (minDateStr) => {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        postDate: {
          [Op.gte]: new Date(minDateStr)
        }
      }
    })
      .then(data => resolve(data))
      .catch(() => reject("no results returned"));
  });
};

module.exports.getItemById = (id) => {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: { id: id }
    })
      .then(data => {
        if (data.length > 0) resolve(data[0]);
        else reject("no results returned");
      })
      .catch(() => reject("no results returned"));
  });
};

module.exports.addItem = (itemData) => {
  return new Promise((resolve, reject) => {
    itemData.published = itemData.published ? true : false;

    for (let prop in itemData) {
      if (itemData[prop] === "") {
        itemData[prop] = null;
      }
    }

    itemData.postDate = new Date();

    Item.create(itemData)
      .then(() => resolve())
      .catch(() => reject("unable to create post"));
  });
};

module.exports.getPublishedItems = () => {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: { published: true }
    })
      .then(data => resolve(data))
      .catch(() => reject("no results returned"));
  });
};

module.exports.getPublishedItemsByCategory = (category) => {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        published: true,
        category: category
      }
    })
      .then(data => resolve(data))
      .catch(() => reject("no results returned"));
  });
};

module.exports.getCategories = () => {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then(data => resolve(data))
      .catch(() => reject("no results returned"));
  });
};

module.exports.addCategory = (categoryData) => {
  return new Promise((resolve, reject) => {
    for (let prop in categoryData) {
      if (categoryData[prop] === "") {
        categoryData[prop] = null;
      }
    }

    Category.create(categoryData)
      .then(() => resolve())
      .catch(() => reject("unable to create category"));
  });
};

module.exports.deleteCategoryById = (id) => {
  return new Promise((resolve, reject) => {
    Category.destroy({
      where: { id: id }
    })
      .then(() => resolve())
      .catch(() => reject("unable to delete category"));
  });
};

module.exports.deletePostById = (id) => {
  return new Promise((resolve, reject) => {
    Item.destroy({
      where: { id: id }
    })
      .then(() => resolve())
      .catch(() => reject("unable to delete post"));
  });
};
