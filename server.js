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
