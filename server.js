/*********************************************************************************
 *  WEB322 – Assignment 02
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: Shinjo Kang Student ID: 118135227 Date: 2023-06-05
 *
 *  Cyclic Web App URL: https://tasty-puce-cougar.cyclic.app
 *
 *  GitHub Repository URL: https://github.com/cmksj1005/web322-app
 *
 ********************************************************************************/

var express = require('express');
var app = express();
const blogService = require('./blog-service');
const path = require('path');

var HTTP_PORT = process.env.PORT || 8080;

function onHttpStart() {
  console.log('Express http server listening on: ' + HTTP_PORT);
}

app.use(express.static('static'));

app.get('/', function (req, res) {
  res.redirect('/about');
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/about.html'));
});

app.get('/blog', function (req, res) {
  blogService
    .getPublishedPosts()
    .then((filteredPosts) => {
      res.json(filteredPosts);
    })
    .catch((err) => {
      console.log('{message: ' + err + '}');
    });
});

app.get('/posts', function (req, res) {
  blogService
    .getAllPosts()
    .then((posts) => {
      res.json(posts);
    })
    .catch((err) => {
      console.log('{message: ' + err + '}');
    });
});

app.get('/categories', function (req, res) {
  blogService
    .getCategories()
    .then((categories) => {
      res.json(categories);
    })
    .catch((err) => {
      console.log('{message: ' + err + '}');
    });
});

app.use((req, res) => {
  res.status(404).send('Page Not Found');
});

blogService
  .initialize()
  .then(() => {
    app.listen(HTTP_PORT, onHttpStart);
  })
  .catch(() => {
    console.log("data don't be initialized");
  });
