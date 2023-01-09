const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
var cookieParser = require("cookie-parser");
const { Election, Admin , Voter , Question , Option } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");


app.use(bodyParser.json());

app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "my-super-secret-key-1111122222",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());




passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      Admin.findOne({ where: { email: username , password : password } })
        .then(async function (user) {
          // const result = await bcrypt.compare(password, user.password);
          const result = 1;
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => {
          console.log(error);
          return done(null, false, { message: "Invalid email" });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  Admin.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get("/", async (request, response) => {
    
    // response.send("first")
    response.render("index");

  });

app.get("/admin", async (request, response) => {
    
    
    response.render("admin");

  });


// app.get("/voter", async (request, response) => {
    
    
//     response.render("voter");

//   });

app.get("/signup", async (request, response) => {
    
    
    response.render("signup");

  });

  app.post("/users", async (request, response) => {
    try {
      const user = await Admin.create({
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        email: request.body.email,
        password: request.body.password,
      });
      request.login(user, (err) => {
        if (err) {
          console.log(err);
        }
        
        response.redirect("/elections");
      });

    } catch (error) {
      console.log(error);
      
      response.redirect("/elections");
    }
  });

  app.get("/signin", async (request, response) => {
    
    
    response.render("signin");

  });
 
  app.get(
    "/elections/:id/voters",
    
    
    async (request, response) => {
      const allVoters = await Voter.getVoters(request.params.id);
      const election = await Election.findByPk(request.params.id);
      console.log("1111111111111",allVoters)
      response.render("voters", {
        title: "Ballot",
        election,
        allVoters,
        id: request.params.id,
      });
    }
  );
  

  app.post(
    "/session",
      passport.authenticate("local", {
        failureRedirect: "/signin"
      }),
      (request, response) => {
        console.log(request.user);
        response.redirect("/elections");
      }
    
  );



  app.get(
    "/elections",
    
    async (request, response) => {
      const allElections = await Election.getElections();
      // console.log("11111111111111111",allElections)
      if (request.accepts("html")) {
        response.render("elections", {
          title: "Todo application",
          allElections
          
        });
      } else {
        response.json({allElections});
      }
    }
  );

  app.post(
    "/elections",
    
    async function (request, response) {
      
      try {
        

        await Election.createElection({
          name: request.body.name,
        
        });
        console.log("11111111111title",request.body.name)
        // console.log("11111111111name",request)
        // const obj = JSON.parse("2222",JSON.stringify(request.body)); // req.body = [Object: null prototype] { title: 'product' }

        // console.log(obj);
        // const obj = Object.assign({},request.body)

        // console.log("111111122222",obj)
        // const form = JSON.parse(JSON.stringify(request.body))
        // console.log("123",form.title)
        return response.redirect("/elections");
      } catch (error) {
        console.log(error)
  
        return response.redirect("/");
      }
    }
  );

  app.post(
    "/elections/:id/voters",
    
    async function (request, response) {
      
      try {
        

        await Voter.createVoter({
          id: request.body.id,
          password: request.body.password,
          electionId : request.params.id
        });
        // console.log("11111111111title",request.body.password)
        
        return response.redirect(`/elections/${request.params.id}/voters`);
      } catch (error) {
        console.log(error)
  
        return response.redirect("/");
      }
    }
  );

  app.get(
    "/elections/:id",

    async (request, response) => {
      try {
        // const allVoters = await Voter.getVoters();

        const { name, electionStatus } = await Election.findByPk(
          request.params.id
        );
        // const quesCount = await Question.count({
        //   where: {
        //     electionId: request.params.id,
        //   },
        // });
        // const voterCount = await Voter.count({
        //   where: {
        //     electionId: request.params.id,
        //   },
        // });
  
        response.render("electionPage", {
          title: name,
          // quesCount,
          // voterCount,
          // allVoters,
          electionName: name,
          electionStatus,
          id: request.params.id,
          // csrfToken: request.csrfToken(),
        });
      } catch (error) {
        console.log(error);
      }
    }
  );

  app.delete(
    "/elections/:id",
    
    async function (request, response) {
      console.log("We have to delete a Todo with ID: ", request.params.id);
      try {
        await Election.deleteElection(request.params.id);
        return response.json({ success: true });
      } catch (error) {
        return response.status(422).json(error);
      }
    }
  );


module.exports = app;

