/*********************************************************************************
 *  WEB322 – Assignment 06
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: Shinjo Kang Student ID: 118135227 Date: 2023-08-11
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
const authData = require('./auth-service');

const env = require('dotenv');
env.config();

const clientSessions = require('client-sessions');

var HTTP_PORT = process.env.PORT || 8080;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

app.use(express.urlencoded({ extended: true }));

// session data available at req.cookieName i.e. req.session here:
app.use(
  clientSessions({
    cookieName: 'session', // this is the object name that will be added to 'req'
    secret: 'long_unguessable_password_string_web322', // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
  })
);

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
}

function onHttpStart() {
  console.log('Express http server listening on: ' + HTTP_PORT);
}

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
      formatDate: function (dateObj) {
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString();
        let day = dateObj.getDate().toString();
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      },
    },
  })
);
app.set('view engine', '.hbs');

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

app.get('/blog/:id', ensureLogin, async (req, res) => {
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

app.get('/posts', ensureLogin, function (req, res) {
  const inputCategory = req.query.category;
  const inputMinDate = req.query.minDate;

  if (inputCategory) {
    blogService
      .getPostsByCategory(inputCategory)
      .then((inputCategory) => {
        if (inputCategory.length > 0) {
          res.render('posts', { data: inputCategory });
        } else {
          res.render('posts', { message: 'no results' });
        }
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
      .then((inputMinDate) => {
        if (inputMinDate.length > 0) {
          res.render('posts', { data: inputMinDate });
        } else {
          res.render('posts', { message: 'no 11results' });
        }
        // res.json(posts);
      })
      .catch((error) => {
        console.log('{message: ' + error + '}');
        res.render('posts', { message: 'no results' });
        //res.status(500).json({ error: 'No results returned' });
      });
  } else {
    console.log('In posts route');
    blogService
      .getAllPosts()
      .then((posts) => {
        if (posts.length > 0) {
          res.render('posts', { data: posts });
        } else {
          res.render('posts', { message: 'no results' });
        }
        // res.json(posts);
      })
      .catch((error) => {
        console.log('{message: ' + error + '}');
        res.render('posts', { message: 'no results' });
        //res.status(500).json({ error: 'No results returned' });
      });
  }
});

app.get('/post/value', ensureLogin, function (req, res) {
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

app.get('/categories', ensureLogin, function (req, res) {
  blogService
    .getCategories()
    .then((categories) => {
      if (categories.length > 0) {
        res.render('categories', { data: categories });
      } else {
        res.render('categories', { message: 'no results' });
      }
      //res.json(categories);
    })
    .catch((err) => {
      console.log('{message: ' + err + '}');
      res.render('categories', { message: 'no results' });
    });
});

app.get('/categories/add', (req, res) => {
  res.render('addCategory', {
    layout: 'main',
  });
});

app.post('/categories/add', ensureLogin, (req, res) => {
  return new Promise((resolve, reject) => {
    blogService
      .addCategory(req.body)
      .then((result) => {
        resolve(result);
        res.redirect('/categories');
      })
      .catch((error) => {
        reject(error);
      });
  });
});

app.get('/posts/add', ensureLogin, (req, res) => {
  blogService
    .getCategories()
    .then((resolvedCategories) => {
      res.render('addPost', {
        data: resolvedCategories,
      });
    })
    .catch((err) => {
      res.render('addPost', {
        categories: [],
      });
    });
});
// *Before using Handlebars*
// app.get('/posts/add', function (req, res) {
//   res.sendFile(path.join(__dirname, '/views/addPost.html'));
// });

app.post(
  '/posts/add',
  ensureLogin,
  upload.single('featureImage'),
  (req, res) => {
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
  }
);

app.get('/categories/delete/:id', ensureLogin, (req, res) => {
  blogService
    .deleteCategoryById(req.params.id)
    .then(() => {
      res.redirect('/categories');
    })
    .catch((err) => {
      res.status(500).send('Internal Server Error');
      console.log('Unable to Remove Category / Category not found');
    });
});

app.get('/posts/delete/:id', ensureLogin, (req, res) => {
  console.log('It is in post delete id');
  blogService
    .deletePostById(req.params.id)
    .then(() => {
      res.redirect('/posts');
    })
    .catch((err) => {
      res.status(500).send('Internal Server Error');
      console.log('Unable to Remove Post / Post not found');
    });
});

app.get('/login', (req, res) => {
  res.render('login', {
    layout: 'main',
  });
});

app.get('/register', (req, res) => {
  res.render('register', {
    layout: 'main',
  });
});

app.post('/register', (req, res) => {
  authData
    .registerUser(req.body)
    .then((success) => {
      // res.redirect("/")
      res.render('register', { successMessage: 'User created' });
    })
    .catch((err) => {
      res.render('register', {
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});

app.post('/login', (req, res) => {
  req.body.userAgent = req.get('User-Agent');
  authData
    .checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };

      res.redirect('/posts');
    })
    .catch((err) => {
      res.render('login', { errorMessage: err, userName: req.body.userName });
    });
});

app.get('/logout', ensureLogin, (req, res) => {
  req.session.reset();
  res.redirect('/');
});

app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('userHistory', {
    layout: 'main',
  });
});

app.use((req, res) => {
  res.status(404).render('404');
});

// blogService
//   .initialize()
//   .then(() => {
//     app.listen(HTTP_PORT, onHttpStart);
//   })
//   .catch(() => {
//     console.log("data don't be initialized");
//   });

blogData
  .initialize()
  .then(authData.initialize)
  .then(function () {
    app.listen(HTTP_PORT, function () {
      console.log('app listening on: ' + HTTP_PORT);
    });
  })
  .catch(function (err) {
    console.log('unable to start server: ' + err);
  });
