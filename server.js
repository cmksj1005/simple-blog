/*********************************************************************************
 *  WEB322 – Assignment 03
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: Shinjo Kang Student ID: 118135227 Date: 2023-06-19
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

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const upload = multer(); // no { storage: storage }
app.use(express.urlencoded({ extended: true }));

var HTTP_PORT = process.env.PORT || 8080;

cloudinary.config({
  cloud_name: 'dkq0f4tvy',
  api_key: '475962748573349',
  api_secret: 'Sh37Mo6j-tE6MKUpFnMLqEV3Vkk',
  secure: true,
});

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
  const inputCategory = req.query.category;
  const inputMinDate = req.query.minDate;

  if (inputCategory) {
    blogService
      .getPostsByCategory(inputCategory)
      .then((posts) => {
        res.json(posts);
      })
      .catch((error) => {
        console.log('{message: ' + error + '}');
      });
  } else if (inputMinDate) {
    blogService
      .getPostsByMinDate(inputMinDate)
      .then((posts) => {
        res.json(posts);
      })
      .catch((error) => {
        console.log('{message: ' + error + '}');
      });
  } else {
    blogService
      .getAllPosts()
      .then((posts) => {
        res.json(posts);
      })
      .catch((error) => {
        console.log('{message: ' + error + '}');
      });
  }
});

app.get('/post/value', function (req, res) {
  const value = req.query.value;

  blogService
    .getPostById(value)
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

app.get('/posts/add', function (req, res) {
  res.sendFile(path.join(__dirname, '/views/addPost.html'));
});

app.post('/posts/add', upload.single('featureImage'), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
      return result;
    }

    upload(req).then((uploaded) => {
      processPost(uploaded.url);
    });
  } else {
    processPost('');
  }

  function processPost(imageUrl) {
    req.body.featureImage = imageUrl;
    blogService
      .addPost(req.body)
      .then(() => {
        res.redirect('/posts');
      })
      .catch((err) => {
        res.redirect('/posts/add');
        console.log(err);
      });
    // TODO: Process the req.body and add it as a new Blog Post before redirecting to /posts
  }
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
