var express = require('express');
var router = express.Router();
var mongoClient = require('mongodb').MongoClient;
var bodyParser = require('body-parser');
var crypto = require('crypto');
var cookieParser = require('cookie-parser');
var mongo = require('mongodb');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var url = "mongodb://127.0.0.1:27017";

function getHash(pswd) {
  return crypto.createHash('sha256').update(pswd).digest('hex');
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/login');
});

router.get('/register', (req, res, next) => {
  if(req.cookies.userData) {
    res.redirect('/home');
  } else {
    res.render('register');
  }
})

router.post('/register', function (req, res, next) {
  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;
  // console.log(username, email, password);

  mongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {
    if(err) throw err;
    var myobj = {
      username: username,
      email: email,
      password: getHash(password)
    };
    const collection = client.db("movie-review").collection("users");
    collection.find({email: email}).toArray(function(err, items) {
      if(err) throw err;
      if(items.length > 0) {
        res.redirect('/register?status=' + encodeURIComponent('email-already-used'));
      } else {
        collection.insertOne(myobj);
        res.redirect('/register?status=' + encodeURIComponent('success'));
      }
      client.close();
    });
  });
});

 

router.get('/login', (req, res, next) => {
  if(req.cookies.userData) {
    res.redirect('/home');
  } else {
    res.render('login');
  }
})

router.get('/home', (req, res, next) => {
  if(req.cookies.userData == undefined) {
    res.redirect('/login');
  } else {
    res.render('index', {

      username : req.cookies.userData.username,
      email : req.cookies.userData.email,
    });
    // res.render('index');
  }
});

router.post('/login', (req, res, next) => {
  var email = req.body.email;
  var password = getHash(req.body.password);

  mongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {    
    if(err) throw err;
    var query = {
      email: email,
      password: password
    };
    const collection = client.db("movie-review").collection("users");
    collection.find(query).toArray((err, items) => {
      if(err) throw err;

      if(items.length == 1) {
        res.cookie('userData',items[0],{ maxAge: 1000 * 60 * 60 * 24 });
        res.redirect('/home');
      } else {
        res.redirect('/login?status=' + encodeURIComponent('incorrect'));
      }
      client.close();
    });
  })
});

router.get('/logout', (req, res) => {
  res.clearCookie('userData');
  res.redirect('/login');
});

router.get('/comments/:imdb_id', (req, res) => {
  // console.log(req.cookies.userData.username);
  // console.log(req.params.imdb_id);
  // res.send("you are selected imdb id " + req.params.imdb_id);
  var username = req.cookies.userData.username;
  var id = req.params.imdb_id;

  var query = {
    movieid: id
  };

  mongoClient.connect(url, { useNewUrlParser: true , useUnifiedTopology: true}, function(err, client) {
    if (err) throw err;
    
    const collection = client.db("movie-review").collection("comments");
    collection.find(query).sort({timestamps:-1}).toArray((err, items) => {
      if(err) throw err;
      console.log(items)
      res.render('comments', {
        items: items,
        title:"express",
        imdb_id: id,
        username:username
      });
      client.close();
    });
    
  });

});


router.post('/comments/:imdb_id', (req, res, next) => {
  // console.log('working!!!');
  // console.log(comment);
  var username = req.cookies.userData.username;
  var comment = req.body.comment;
  var id = req.params.imdb_id;

  var d = new Date();
  var date = d.getDate();
  var month = d.getMonth();
  var year = d.getFullYear();
  var hour = d.getHours();
  var minute = d.getMinutes();
  var timestamps = d.getTime();

  var datestr = String(date) + '/' + String(month) + '/' + String(year);
  var timestr = String(hour) + ":" + String(minute);
 
  var myobj2 = {
    movieid: id,
    username: username,
    comment: comment,
    currentDate: datestr,
    currentTime: timestr,
    timestamps: timestamps
  };

  mongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {    
    if(err) throw err;
    var myobj = {
      movieid: id,
      username: username,
      comment: comment
    };
    const collection = client.db("movie-review").collection("comments");
    collection.find(myobj).toArray((err, items) => {
      if(err) throw err;

      if(items.length >= 1) {
      } else {
        collection.insertOne(myobj2);
      }
      client.close();
    });
  });

  var query = {
    movieid: id
  };

  // mongoClient.connect(url, { useNewUrlParser: true , useUnifiedTopology: true}, function(err, client) {
  //   if (err) throw err;
    
  //   const collection = client.db("movie-review").collection("comments");
  //   collection.find(query).toArray((err, items) => {
  //     if(err) throw err;
  //     res.render('comments', {
  //       items: items,
  //       title:"express",
  //       imdb_id: id,
  //       username: username
  //     });
  //     client.close();
  //   });
    
  // });

  console.log(req.params.imdb_id);
  // comments/${movie.imdb_id}
  res.redirect('/comments/' + String(req.params.imdb_id))
  // res.redirect('/comments/{req.params.imdb_id}')
  // for(var i = 0; i < result.d.length; i++) {
  //   console.log(i + "thlelement is " + result.d[i].comment);
  // }

  // res.render('comments', result);

});

module.exports = router;
