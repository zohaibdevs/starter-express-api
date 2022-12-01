const HTTP_PORT = process.env.PORT || 8080;

const express = require('express');
const path = require('path');
const app = express();
const multer = require('multer')
const fs = require('fs')
const handleBars = require('express-handlebars')
const clientSessions =require('client-sessions');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/images/uploaded')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage })



const data = require(path.join(__dirname, 'data-service.js'));
const dataServiceAuth  = require(path.join(__dirname, 'data-service-auth.js'));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }))

app.engine('.hbs', handleBars.engine({
  extname: '.hbs', helpers: {
    navLink: function (url, options) {
      return '<li' +
        ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
        '><a href="' + url + '">' + options.fn(this) + '</a></li>';
    }
    ,
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    }
  }
}));
app.set('view engine', '.hbs');


app.use(clientSessions({
  cookieName: 'session', // cookie name dictates the key name added to the request object
  secret: 'web322', // should be a large unguessable string
  duration: 2 * 60 * 1000, // how long the session will stay valid in ms
  activeDuration: 1000 * 60 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
}));


function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});

app.use(function (req, res, next) {
  let route = req.baseUrl + req.path;
  app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
  next();
});

app.use(express.urlencoded({ extended: false }));




app.get('/login', (req, res, next) => {
  res.render('login');
});

app.post('/login', (req, res, next) => {
  req.body.userAgent = req.get('User-Agent');
  return dataServiceAuth.checkUser(req.body)
  .then((user)=>{
    req.session.user = {
      userName: user.userName, // authenticated user's userName
      email:user.email, // authenticated user's email
      loginHistory:user.loginHistory // authenticated user's loginHistory
    }
    res.redirect('/students');
  }).catch((err)=>{
    res.render('login', {errorMessage: err, userName: req.body.userName});
  })
});

app.get('/register', (req, res, next) => {
  return res.render('register');
});

app.post('/register', (req, res, next) => {
  return dataServiceAuth
  .registerUser(req.body)
  .then((resp)=>{
     res.render('register', {successMessage: "User created"});
  }).catch((err)=>{
    return res.render('register',  {errorMessage: err, userName: req.body.userName});
  });
});

app.get("/userHistory", ensureLogin, function(req, res) {
  res.render("userHistory");
});

app.get("/logout", function(req, res) {
  req.session.reset();
  res.redirect("/");
});

app.get('/', (req, res, next) => {
  res.render('home');
});

app.get('/about', (req, res, next) => {
  res.render('about');
});

app.get('/students', ensureLogin, (req, res, next) => {
  if (req.query.status) {
    return data.getStudentsByStatus(req.query.status)
      .then(data => { res.render("students", { students: data }) })
      .catch(err => {
        res.render("students", { message: err })
      })
  }
  if (req.query.program) {
    return data.getStudentsByProgramCode(req.query.program)
      .then(data => { res.render("students", { students: data }) })
      .catch(err => {
        res.render("students", { message: err })
      })
  }
  if (req.query.credential) {
    return data.getStudentsByExpectedCredential(req.query.credential)
      .then(data => { res.render("students", { students: data }) })
      .catch(err =>{
        res.render("students", { message: err });
      })
  }
  data
    .getAllStudents()
    .then((data) => {
      console.log(data);
      res.render("students", { students: data })
    })
    .catch((err) => {
      console.log('Error retrieving employees: ' + err);
      res.render("students", { message: err })
    });
});

app.get('/student/:sid', ensureLogin, (req, res) => {
  data.getStudentById(req.params.sid)
    .then((data) => {
      res.render("student", { student: data })
    })
    .catch(err => {
      res.status(404).send("Student Not found");
    })
})

app.post('/students/add', ensureLogin, (req, res) => {
  data.addStudent(req.body).then(
    res.redirect('/students')
  )
    .catch(err => {
      res.status(500).send("Unable to add Student");
    })
})

app.post("/student/update", ensureLogin, (req, res) => {
  data.updateStudent(req.body).then(() => {
    res.redirect("/students");
  }).catch(err => {
    res.status(500).send("Unable to Update Student");
  })
});


app.get('/intlstudents', ensureLogin, (req, res, next) => {
  data
    .getInternationalStudents()
    .then((data) => {
      res.render("students", { students: data })
    })
    .catch((err) => {
      console.log('Error retrieving managers: ' + err);
      res.render("students", { message: err })
    });
});

app.get('/programs', ensureLogin, (req, res, next) => {
  data
    .getPrograms()
    .then((data) => {
      res.render('programs', { programs:data });
    })
    .catch((err) => {
      console.log('Error retrieving departments: ' + err);
      res.render('programs', { message:err });
    });
});

app.get('/programs/add', ensureLogin, (req, res, next) => {
    res.render('addProgram');
});

app.post('/programs/add', ensureLogin, (req, res, next) => {
  data 
    .addProgram(req.body)
    .then(()=>{
       res.redirect('/programs');
    }).catch(err => {
      res.status(500).send("Unable to add program");
    });
});

app.get('/programs/:pcode', ensureLogin, (req, res) => {
  data.getProgramByCode(req.params.pcode)
    .then((data) => {
      res.render("program", { program: data })
    })
    .catch(err => {
      res.status(404).send("Program Not Found"); 
    })
})

app.get('/programs/update', ensureLogin, (req, res) => {
  data
    .updateProgram(req.body)
    .then((data) => {
      res.redirect('/programs');
    })
    .catch((err) => {
      res.status(500).send("Unable to update");
    });
});

app.get('/programs/:programCode', ensureLogin, (req, res, next) => {
  data
    .getProgramByCode(req.params.programCode)
    .then((data) => {
      res.render('programs', { programs:data });
    })
    .catch((err) => {
      console.log('Error retrieving departments: ' + err);
      // res.render('programs', { message:err });
      res.status(404).send("Program not found");
    });
});

app.get('/students/delete/:id', ensureLogin, (req, res) => {
  return data.deleteStudenById(req.params.id)
  .then(data => { 
    res.redirect("/students") })
  .catch(err => {
    res.status(404).send("student Not Found"); 
  })
});

app.get('/programs/delete/:id', ensureLogin, (req, res) => {
  return data.deleteProgramByCode(req.params.id)
  .then(data => { 
    res.redirect("/programs") })
  .catch(err => {
    res.status(404).send("program not found");
  })
});

app.get('/students/add', ensureLogin, (req, res) => {
  data.getPrograms().then((programs)=>{
    res.render('addStudent', {programs:programs});
  }).catch(()=>{
    res.render('addStudent', {message:'no program found'});
  })
})
app.get('/images/add', ensureLogin, (req, res) => {
  res.render('AddImage');
})
app.post('/images/add', upload.single('imageFile'), (req, res) => {
  res.redirect('/images')
})

app.get('/images', (req, res) => {
  fs.readdir("./public/images/uploaded", ensureLogin, function (err, data) {
    if (err) return console.log(err)
    console.log(data)
    res.render('images', {
      data: data,
      layout: false // do not use the default Layout (main.hbs)
    })
  })
})

app.use((req, res, next) => {
  res.status(404).send('Page Not Found');
});

data.initialize()
.then(dataServiceAuth.initialize)
.then(function(){
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
    console.log("unable to start server: " + err);
});

