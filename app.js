const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
var cookieParser = require("cookie-parser");
const { Election, Admin , Voter , Question , Option } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
const connectEnsureLogin = require("connect-ensure-login");
const passport = require("passport");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const { ConnectionRefusedError } = require("sequelize");

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

app.get("/login", async (request, response) => {
    response.render("signin");
  });

  app.get("/signup", async (request, response) => {
    response.render("signup");
  });

  app.get("/signin", async (request, response) => {
    response.render("signin");
  });
 
  app.get("/signout", (request, response, next) => {
    request.logout((err) => {
      if (err) {
        return next(err);
      }
      response.redirect("/");
    });
  });
  
  app.get(
    "/elections",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      const loggedInAdmin = request.user.id;
      const allElections = await Election.getElections(loggedInAdmin);
      // console.log("9999999999999",allElections)
      // console.log("11111111111111111",allElections)
      if (request.accepts("html")) {
        response.render("elections", {
          title: "Elections",
          allElections
        });
      } else {
        response.json({allElections});
      }
    }
  );

  app.get(
    "/elections/:id",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      try {
        const { name, electionStatus } = await Election.findByPk(
          request.params.id
        );
        response.render("electionPage", {
          title: name,
          electionName: name,
          electionStatus,
          id: request.params.id,
        });
      } catch (error) {
        console.log(error);
      }
    }
  );

  app.get(
    "/elections/:id/voters",
    connectEnsureLogin.ensureLoggedIn(),
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

  app.get(`/elections/:id/questions`,
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInAdmin = request.params.id;
    // console.log("bbbbbbbbbbbbbbbb",loggedInAdmin)
    const allQuestions = await Question.allQuestions(loggedInAdmin);
    // console.log("4444444444444444444444444",allQuestions)
    response.render("questions",
    {id : request.params.id,
    allQuestions}
    )
  }
  )
  
  app.get(
    "/elections/:id/questions/:qid",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      try {
        const question = await Question.findByPk(request.params.qid);
        const election = await question.getElection();
        const allOptions = await Option.getOptions(request.params.qid)
        // let editable=false;
        response.render("manageQuestion", {
          title: "Manage Question",
          question: question,
          election,
          allOptions,
          // editable,
          
        });
      } catch (error) {
        console.log(error);
      }
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
  app.post(
    "/users",
     async (request, response) => {
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
  app.post(
    "/elections",
    connectEnsureLogin.ensureLoggedIn(),
    async function (request, response) {
      try {
        await Election.createElection({
          name: request.body.name,
          adminId: request.user.id
        });
        // console.log("11111111111title",request.body.name)
        // console.log("11111111111name",request
        return response.redirect("/elections");
      } catch (error) {
        console.log(error)
        return response.redirect("/");
      }
    }
  );

  app.post(
    `/elections/:id/questions`,
    connectEnsureLogin.ensureLoggedIn(),
    async function (request, response) {
      try {
        await Question.createQuestion({
          name: request.body.name,
          desc: request.body.desc,
          electionId: request.params.id,
        });
        // console.log("111111",request.body.name,"2222222",request.body.desc,"33333333333",request.params.id)
        return response.redirect(`/elections/${request.params.id}/questions`);
      } catch (error) {
        console.log(error)
        return response.redirect("/");
      }
    }
  );

  app.post(
    `/elections/:id/questions/:qid`,
    connectEnsureLogin.ensureLoggedIn(),
    async function (request, response) {
      try {
        // console.log("1111111",request.params.id)
        await Option.createOption({
          name: request.body.name,
          questionId: request.params.qid,
        });
        // console.log("111111",request.body.name,"2222222",request.body.desc,"33333333333",request.params.id)
        // console.log("3333333")
        return response.redirect(`/elections/${request.params.id}/questions/${request.params.qid}`);
      } catch (error) {
        console.log(error)
        return response.redirect("/");
      }
    }
  );

  app.post(
    "/elections/:id/voters",
    connectEnsureLogin.ensureLoggedIn(),
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

  app.put(
    "/elections/:id/questions/:qid",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const updatedQuestion=Question.updateQuestion({
      name:request.body.name,
      desc:request.body.description,
      questionId:request.params.qid
    })
    return response.json(updatedQuestion)
  }
  )

  

  app.delete(
    "/elections/:id",
    connectEnsureLogin.ensureLoggedIn(),
    async function (request, response) {
      // console.log("We have to delete a Todo with ID: ", request.params.id);
      try {
        await Election.deleteElection(request.params.id);
        return response.json({ success: true });
      } catch (error) {
        return response.status(422).json(error);
      }
    }
  );

  app.delete(
    "/elections/:id/questions/:qid",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      try {
        const election = await Election.findByPk(request.params.id);
          const value = await Question.deleteQuestion(request.params.qid);
          response.status(200).json(value > 0 ? true : false);
      } catch (error) {
        console.log(error);
      }
    }
  );

module.exports = app;

