const fs = require('fs');
let categories = [];
let posts = [];

module.exports.initialize = () => {
  return new Promise((resolve, reject) => {
    fs.readFile('./data/posts.json', 'utf-8', (err, data) => {
      if (err) {
        reject('unable to read file');
      }
      posts = JSON.parse(data);
      fs.readFile('./data/categories.json', 'utf-8', (err, data) => {
        if (err) {
          reject('unable to read file');
        }
        categories = JSON.parse(data);
        resolve('unable to read file');
      });
    });
  });
};

module.exports.getAllPosts = () => {
  return new Promise((resolve, reject) => {
    if (posts.length == 0) {
      reject('no results returned');
    }
    resolve(posts);
  });
};

module.exports.getPublishedPosts = () => {
  return new Promise((resolve, reject) => {
    if (posts.length == 0) {
      reject('no results returned');
    }
    const filteredPosts = posts.filter((post) => post.published == true);
    resolve(filteredPosts);
  });
};

module.exports.getCategories = () => {
  return new Promise((resolve, reject) => {
    if (categories.length == 0) {
      reject('no results returned');
    }
    resolve(categories);
  });
};
