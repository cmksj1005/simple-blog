/*********************************************************************************
 *  WEB322 – Assignment 04
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: Shinjo Kang Student ID: 118135227 Date: 2023-07-09
 *
 *  Cyclic Web App URL: https://tasty-puce-cougar.cyclic.app
 *
 *  GitHub Repository URL: https://github.com/cmksj1005/web322-app
 *
 ********************************************************************************/

var express = require('express');
var app = express();
const blogService = require('./blog-service');
const exphbs = require('express-handlebars');
const stripJs = require('strip-js');
const blogData = require('./blog-service');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const upload = multer(); // no { storage: storage }

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    '/' +
    (isNaN(route.split('/')[1])
      ? route.replace(/\/(?!.*)/, '')
      : route.replace(/\/(.*)/, ''));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.use(express.urlencoded({ extended: true }));
//To know how to handle HTML files that are formatted using handlebars
app.engine(
  '.hbs',
  exphbs.engine({
    extname: '.hbs',
    helpers: {
      navLink: function (url, options) {
        return (
          '<li' +
          (url == app.locals.activeRoute ? ' class="active" ' : '') +
          '><a href="' +
          url +
          '">' +
          options.fn(this) +
          '</a></li>'
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error('Handlebars Helper equal needs 2 parameters');
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      safeHTML: function (context) {
        return stripJs(context);
      },
    },
  })
);
app.set('view engine', 'hbs');

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
  res.render('about'); // Renders the "about" view using Handlebars
});
// *Before using Handlebars*
// app.get('/about', (req, res) => {
//   res.sendFile(path.join(__dirname, '/views/about.html'));
// });

app.get('/blog', async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogData.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogData.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest post from the front of the list (element 0)
    let post = posts[0];

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;
    viewData.post = post;
  } catch (err) {
    viewData.message = 'no results';
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blogData.getCategories();
    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = 'no results';
  }

  // render the "blog" view with all of the data (viewData)
  res.render('blog', { data: viewData });
});

// app.get('/blog', function (req, res) {
//   blogService
//     .getPublishedPosts()
//     .then((filteredPosts) => {
//       res.json(filteredPosts);
//     })
//     .catch((err) => {
//       console.log('{message: ' + err + '}');
//     });
// });

app.get('/blog/:id', async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};
  try {
    // declare empty array to hold "post" objects
    let posts = [];
    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogData.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogData.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;
  } catch (err) {
    viewData.message = 'no results';
  }

  try {
    // Obtain the post by "id"
    viewData.post = await blogData.getPostById(req.params.id);
  } catch (err) {
    viewData.message = 'no results';
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blogData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = 'no results';
  }

  // render the "blog" view with all of the data (viewData)
  res.render('blog', { data: viewData });
});

app.get('/posts', function (req, res) {
  const inputCategory = req.query.category;
  const inputMinDate = req.query.minDate;

  if (inputCategory) {
    blogService
      .getPostsByCategory(inputCategory)
      .then((posts) => {
        res.render('posts', { data: posts });
        // res.json(posts);
      })
      .catch((error) => {
        console.log('{message: ' + error + '}');
        res.render('posts', { message: 'no results' });
        //res.status(500).json({ error: 'No results returned' });
      });
  } else if (inputMinDate) {
    blogService
      .getPostsByMinDate(inputMinDate)
      .then((posts) => {
        res.render('posts', { data: posts });
        // res.json(posts);
      })
      .catch((error) => {
        console.log('{message: ' + error + '}');
        res.render('posts', { message: 'no results' });
        //res.status(500).json({ error: 'No results returned' });
      });
  } else {
    blogService
      .getAllPosts()
      .then((posts) => {
        res.render('posts', { data: posts });
        // res.json(posts);
      })
      .catch((error) => {
        console.log('{message: ' + error + '}');
        res.render('posts', { message: 'no results' });
        //res.status(500).json({ error: 'No results returned' });
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
      res.render('Categories', { data: categories });
      //res.json(categories);
    })
    .catch((err) => {
      console.log('{message: ' + err + '}');
      res.render('Categories', { message: 'no results' });
    });
});

app.get('/posts/add', (req, res) => {
  res.render('addPost'); // Renders the "about" view using Handlebars
});
// *Before using Handlebars*
// app.get('/posts/add', function (req, res) {
//   res.sendFile(path.join(__dirname, '/views/addPost.html'));
// });

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
  res.status(404).render('404');
});

blogService
  .initialize()
  .then(() => {
    app.listen(HTTP_PORT, onHttpStart);
  })
  .catch(() => {
    console.log("data don't be initialized");
  });
