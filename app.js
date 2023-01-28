const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
var cookieParser = require("cookie-parser");
const { Election, Admin, Voter, Question, Option } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
const connectEnsureLogin = require("connect-ensure-login");
const passport = require("passport");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt")
const flash = require("connect-flash");
const saltRounds = 10;
app.use(flash());



app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.use(
  session({
    secret: "my-super-secret-key-1111122222",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

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
  "Admin",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      Admin.findOne({ where: { email: username} })
        .then(async function (user) {
          const result = await bcrypt.compare(password, user.password);
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

passport.use(
  "Voter",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    (request, username, password, done) => {
      Voter.findOne({
        where: {
          email: username,
          electionId: request.params.id,
        },
      })
        .then(async function (user) {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            // console.log("999999deleteVoterdeleteVoter")
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
  let UserIsVoter ;
  if (user.electionId){
    UserIsVoter = true
  }
  if (user.firstName){
    UserIsVoter = false
  }
  console.log("Serializing user in session", user.id);
  done(null, { _id:user.id , UserIsVoter});
});

passport.deserializeUser((auth, done) => {
  if (auth.UserIsVoter){
    Voter.findByPk(auth._id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
  }
  else{Admin.findByPk(auth._id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });}
});

function voterLoggedIn(){
  return (request,response,next)=>{
    if (request.user && request.user.electionId){
      next()
    }
    else{
      response.redirect(`/elections/${request.params.id}/voterLogin`)
    }
  }
}



function manageQuestions(){
  return async (request,resonse,next)=>{
    const election = await Election.findByPk(request.params.id)
    electionRunning = election.electionStatus
    if (request.user && electionRunning===false){
      next()
    }
    else{
      resonse.redirect(`/elections/${request.params.id}`)
    }
  }
}

function voterStatus(){
  return async (request,resonse,next)=>{
    const voter = await Voter.findByPk(request.user.id)
    votingPower = voter.voteStatus
    if (request.user && votingPower===false){
      next()
    }
    else{
      resonse.redirect(`/elections/${request.params.id}/voterLogin`)
    }
  }
}

function electionRunning(){
  return async(request,response,next)=>{
    const election = await Election.findByPk(request.params.id)
    if (election.electionStatus){
      next()
    }
    else{
      response.redirect(`/elections/${request.params.id}/results`)

    }
  }
}

function adminIsLoggedin()
{
  return (request,response,next)=>{
    // console.log(request.user.firstName,"wwwwwwwwwwwwwwwww")
    console.log(request.user,"aaaa")
    if (request.user && (request.user.electionId)){
      response.redirect("/")
    }
    else{
      next()
    }
  }
}

app.get("/", async (request, response) => {
  if (request.user && request.user.firstName) {
    response.redirect("/elections");
  } else {
    // console.log(request.body.user);
    response.render("index",{
    csrfToken: request.csrfToken(),
    })
  }
});

app.get("/login", async (request, response) => {
  if (request.user && request.user.firstName) {
    response.redirect("/elections");
  } else {
    // console.log(request.body.user);
    response.render("signin", {
      title: "Signin",
      csrfToken: request.csrfToken(),
    });
  }
});

app.get("/signup", async (request, response) => {
  if (request.user && request.user.firstName) {
    response.redirect("/elections");
  } else {
    // console.log(request.body.user);
    response.render("signup", {
      title: "Signup",
      csrfToken: request.csrfToken(),
    });
  }
});

app.get("/signin", async (request, response) => {
  if (request.user && request.user.firstName) {
    response.redirect("/elections");
  } else {
    // console.log(request.body.user);
    response.render("signin", {
      title: "Signin",
      csrfToken: request.csrfToken(),
    });
  }
});

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.get("/elections", 
connectEnsureLogin.ensureLoggedIn(),
adminIsLoggedin(),
async (request, response) => {
  try{const loggedInAdmin = request.user.id;
  const allElections = await Election.getElections(loggedInAdmin);
  // console.log("9999999999999",allElections)
  // console.log("11111111111111111",allElections)
  if (request.accepts("html")) {
    response.render("elections", {
      title: "Elections",
      allElections,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({ allElections });
    // console.log("1111")
  }}catch(error){console.log("error")}
});

app.get(
  "/elections/:id",
  connectEnsureLogin.ensureLoggedIn(),
  adminIsLoggedin(),
  async (request, response) => {
    console.log(adminIsLoggedin(),"9999")
    try {
      const { name, electionStatus } = await Election.findByPk(
        request.params.id
      );
      response.render("electionPage", {
        title: name,
        electionName: name,
        electionStatus,
        id: request.params.id,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
    }
  }
);

app.get(
  "/elections/:id/voters",
  connectEnsureLogin.ensureLoggedIn(),
  adminIsLoggedin(),
  async (request, response) => {
    try{const allVoters = await Voter.getVoters(request.params.id);
    const election = await Election.findByPk(request.params.id);
    // console.log("1111111111111",allVoters)
    response.render("voters", {
      title: "Ballot",
      election,
      allVoters,
      id: request.params.id,
      csrfToken: request.csrfToken(),
    });
  }catch(error){
    console.log(error)
  }}
);

app.get(
  `/elections/:id/questions`,
  connectEnsureLogin.ensureLoggedIn(),
  adminIsLoggedin(),
  manageQuestions(),
  async (request, response) => {
    try{const loggedInAdmin = request.params.id;
    const election = await Election.findByPk(request.params.id);
    // console.log("bbbbbbbbbbbbbbbb",loggedInAdmin)
    const allQuestions = await Question.allQuestions(loggedInAdmin);
    // console.log("4444444444444444444444444",allQuestions)
    response.render("questions", {
      id: request.params.id,
      title: "Question",
      allQuestions,
      election,
      csrfToken: request.csrfToken(),
    });}catch(error){console.log(error)}
  }
);

app.get(
  "/elections/:id/questions/:qid",
  connectEnsureLogin.ensureLoggedIn(),
  adminIsLoggedin(),
  manageQuestions(),
  async (request, response) => {
    try {
      const question = await Question.findByPk(request.params.qid);
      const election = await question.getElection();
      const allOptions = await Option.getOptions(request.params.qid);
      // let editable=false;
      response.render("manageQuestion", {
        title: "Manage Question",
        question: question,
        election,
        allOptions,
        csrfToken: request.csrfToken(),
        // editable,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

app.get(
  "/elections/:id/electionPreview",
  connectEnsureLogin.ensureLoggedIn(),
  adminIsLoggedin(),
  async (request, response) => {
    try{let allOptions = {};
    let options;
    const election = await Election.findByPk(request.params.id);
    const allQuestions = await Question.allQuestions(request.params.id);
    const quesCount=allQuestions.length
    let optCount=true
    for (let i = 0; i < allQuestions.length; i++) {
      options = await allQuestions[i].getOptions();
      // options = await Option.getOptions(allQuestions[i]);
      if (options.length<2){
        optCount=false
      }
      // console.log(optionCount,"optionCount")
      allOptions[allQuestions[i].id] = options;
    }
    // console.log(optCount)
    response.render("electionPreview", {
      title: "Preview",
      election,
      allQuestions,
      allOptions,
      quesCount,
      optCount,
      csrfToken: request.csrfToken(),
    });}catch(error){console.log(error)}
  }
);

// connectEnsureLogin.ensureLoggedIn(),
app.get("/elections/:id/electionpage",
electionRunning(),
voterLoggedIn(),
voterStatus(),
 async (request, response) => {
  try{let allOptions = {};
  const election = await Election.findByPk(request.params.id);
  const allQuestions = await Question.allQuestions(request.params.id);
  for (let i = 0; i < allQuestions.length; i++) {
    options = await allQuestions[i].getOptions();
    // options = await Option.getOptions(allQuestions[i]);
    allOptions[allQuestions[i].id] = options;
  }
  const currentStatus = election.electionStatus 
  // console.log(allOptions,"111")
  if (currentStatus){response.render("electionSite", {
    title: "Election Site",
    election,
    allQuestions,
    allOptions,
    csrfToken: request.csrfToken(),
  });}}catch(error){console.log(error)}
});

app.get(
  `/elections/:id/results`,
  // connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
  const { name, electionStatus } = await Election.findByPk(
    request.params.id
  );
  try{const election = await Election.findByPk(request.params.id);
  const vote = await Voter.voteCount(request.params.id)
  const voteCount = vote.length
  if ( !election.electionStatus || (request.user && request.user.firstName) ){
    console.log(election.electionStatus,"1111")
    // console.log(request.user.firstName,"2222")

  let allOptions = {};
  const allQuestions = await Question.allQuestions(request.params.id);
  for (let i = 0; i < allQuestions.length; i++) {
    options = await allQuestions[i].getOptions();
    // options = await Option.getOptions(allQuestions[i]);
    // console.log(options,"666")
    allOptions[allQuestions[i].id] = options;
  }
    response.render("results", {
      // id: request.params.id,
      title: "Results",
      election,
      allQuestions,
      allOptions,
      voteCount,
      electionStatus,
      csrfToken: request.csrfToken(),
    });}
  else{
    response.redirect(`/elections/${election.id}/onGoing`)
  }}catch(error){console.log(error)}
  }
);

app.get("/elections/:id/onGoing",
  async (request, response) => {
    try {
      response.render("onGoing", {
        title: "onGoing Election",
      });
    } catch (error) {
      console.log(error);
    }
  }
);

app.get(
  "/elections/:id/voterLogin",
  async (request, response) => {
    try {
      const electionId = request.params.id
      response.render("voterLogin", {
        title: "Voter Login",
        id: electionId,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
    }
  }
);

app.get("/elections/:id/voterEnd",
async (request,response)=>{
  const election = await Election.findByPk(request.params.id);  try{
    response.render("voterEnd", {
      title: "Voted",
      election,
      csrfToken: request.csrfToken()
    });
  }catch(error){console.log(error)}
})

app.post(
  "/session",
  passport.authenticate("Admin", {
    failureRedirect: "/signin",
    failureFlash: true,
  }),
  (request, response) => {
    try{
    // console.log(request.user,"11111");
    response.redirect("/elections");}
    catch(error){console.log(error,"22222")}
  }
);

app.post(
  "/elections/:id/session",
  passport.authenticate("Voter", {
    failureRedirect: "back",
    failureFlash : true
  }),
  (request, response) => {
    try{console.log(request.user);
    if (!request.user.voteStatus){response.redirect(`/elections/${request.params.id}/electionpage`);}
    else{response.redirect(`/elections/${request.params.id}/results`)}
    }
    catch(error){
      // response.redirect(`/elections/${request.params.id}/results`)
      // response.render("onGoing")
      console.log(error)}
  }
);

app.post("/users", async (request, response) => {
  const hashedPwd = await bcrypt.hash(request.body.password , saltRounds)
  console.log(hashedPwd)
  try {
    const user = await Admin.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      console.log(err);
      response.redirect("/elections");
    });
  } catch (error) {
    console.log(error);
    for (let i = 0; i < error.errors.length; i++) {
      request.flash("error", error.errors[i].message);
    }
    response.redirect("/signup");
  }
});
app.post(
  "/elections",
  connectEnsureLogin.ensureLoggedIn(),
  adminIsLoggedin(),
  async function (request, response) {
    try {
      await Election.createElection({
        name: request.body.name,
        adminId: request.user.id,
      });
      // console.log("11111111111title",request.body.name)
      // console.log("11111111111name",request
      return response.redirect("/elections");
    } catch (error) {
      console.log(error);
      for (let i = 0; i < error.errors.length; i++) {
        request.flash("error", error.errors[i].message);
      }
      // console.log(".........................................")
      return response.redirect("/elections");
    }
  }
);

app.post(
  `/elections/:id/questions`,
  connectEnsureLogin.ensureLoggedIn(),
  adminIsLoggedin(),
  manageQuestions(),
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
      console.log(error);
      for (let i = 0; i < error.errors.length; i++) {
        request.flash("error", error.errors[i].message);
      }
      return response.redirect(`/elections/${request.params.id}/questions`);
    }
  }
);

app.post(
  `/elections/:id/questions/:qid`,
  connectEnsureLogin.ensureLoggedIn(),
  adminIsLoggedin(),
  manageQuestions(),
  async function (request, response) {
    try {
      // console.log("1111111",request.params.id)
      await Option.createOption({
        name: request.body.name,
        questionId: request.params.qid
      });
      // console.log("111111",request.body.name,"2222222",request.body.desc,"33333333333",request.params.id)
      // console.log("3333333")
      return response.redirect(
        `/elections/${request.params.id}/questions/${request.params.qid}`
      );
    } catch (error) {
      console.log(error);
      for (let i = 0; i < error.errors.length; i++) {
        request.flash("error", error.errors[i].message);
      }
      return response.redirect(`/elections/${request.params.id}/questions/${request.params.qid}`);
    }
  }
);

app.post(
  "/elections/:id/voters",
  connectEnsureLogin.ensureLoggedIn(),
  adminIsLoggedin(),
  async function (request, response) {
  const hashedPwd = await bcrypt.hash(request.body.password , saltRounds)

    try {
      await Voter.createVoter({
        id: request.body.id,
        password: hashedPwd,
        electionId: request.params.id,
      });
      // console.log("11111111111title")
      return response.redirect(`/elections/${request.params.id}/voters`);
    } catch (error) {
      // console.log(error);
      // console.log(error.errors[0].message,"111111111111111111111111111111")
      for (let i = 0; i < error.errors.length; i++) {
        request.flash("error", error.errors[i].message);
      }
      return response.redirect(`/elections/${request.params.id}/voters`);
    }
  }
);

app.post("/elections/:id/electionpage", 
voterLoggedIn(),
async (request, response) => {
  // console.log("1234", request.body);
  try{
  const election = await Election.findByPk(request.params.id);
  await Voter.changeVoteStatus(request.user.id)
  for (let i in request.body){
    request.body[i]
    if(request.body[i]!=request.body._csrf){
      const option = await Option.findByPk(request.body[i])
      option.increment("optionCount")}
    // console.log(request.body,"/////////////////////")
  }
  response.redirect(`/elections/${request.params.id}/voterEnd`)
  }
  catch(error){
    console.log(error)
    
  }
});


app.put(
  "/elections/:id/questions/:qid",
  connectEnsureLogin.ensureLoggedIn(),
  adminIsLoggedin(),
  manageQuestions(),
  async function (request, response) {
    try{const updatedQuestion = Question.updateQuestion({
      name: request.body.name,
      desc: request.body.description,
      questionId: request.params.qid,
    });
    return response.json(updatedQuestion);}
    catch(error){console.log(error)}
  }
);

app.put(
  "/elections/:id/questions/:qid/options/:oid",
  connectEnsureLogin.ensureLoggedIn(),
  adminIsLoggedin(),
  manageQuestions(),
  async (request, response) => {
    try {
      // console.log("222")
      const updatedOption = await Option.updateOption({
        updatedName: request.body.name,
        id: request.params.oid,
      });
      response.json(updatedOption);
    } catch (error) {
      console.log(error);
      response.json(error);
    }
  }
);

app.put(
  "/elections/:id/launch",
  connectEnsureLogin.ensureLoggedIn(),
  adminIsLoggedin(),
  async (request, response) => {
    // console.log(request.body,"9989////")
    try {
      // console.log("222")
      await Election.startElection(request.params.id);
      const questions = await Question.allQuestions(request.params.id);
      const allQuestions = questions.map((question) => {
        return question.id;
      });
      // console.log("00000",allQuestions,"1111")
      await Option.resetOptionCount(allQuestions)
      response.json(startElection);
    } catch (error) {
      console.log(error);
      response.json(error);
    }
  }
);

app.put(
  "/elections/:id/end",
  connectEnsureLogin.ensureLoggedIn(),
  adminIsLoggedin(),
  async (request, response) => {
    try {
      // console.log("222")
      const startElection = await Election.endElection(request.params.id);
      const resetVoterStatus = await Voter.resetVoterStatus(request.params.id);
      // const resetOptionCount = await Option.resetOptionCount(request.params.id)
      response.json(startElection);
    } catch (error) {
      console.log(error);
      response.json(error);
    }
  }
);

app.delete(
  "/elections/:id",
  connectEnsureLogin.ensureLoggedIn(),
  adminIsLoggedin(),
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
  adminIsLoggedin(),
  manageQuestions(),
  async (request, response) => {
    const quesCount= await Question.allQuestions(request.params.id)
    // console.log(quesCount.length)
    try {
      // console.log(request.body.count,"esfrnrhgr")
      if (quesCount.length > 1) {
        const value = await Question.deleteQuestion(request.params.qid);
        response.status(200).json(value > 0 ? true : false);
      }
      else{
        console.log("error")
        response.status(400).json(false);
      }
    } catch (error) {
      console.log(error);
    }
  }
);

app.delete(
  "/elections/:id/questions/:qid/:oid",
  connectEnsureLogin.ensureLoggedIn(),
  adminIsLoggedin(),
  manageQuestions(),
  async (request, response) => {
    const optionCount= await Option.getOptions(request.params.qid)
    try {
      if (optionCount.length>2){
        // console.log(request.body.count,'1111')
      const value = await Option.deleteOption(request.params.oid);
      response.status(200).json(value > 0 ? true : false);
      }
      else{
        console.log("error")
        response.status(400).json(false);
      }
    } catch (error) {
      console.log(error);
    }
  }
);

app.delete(
  "/elections/:id/voters/:vid",
  connectEnsureLogin.ensureLoggedIn(),
  adminIsLoggedin(),
  async function (request, response) {
    // console.log(request.params.vid)
    try {
      await Voter.deleteVoter(request.params.vid);
      return response.json({ success: true });
    } catch (error) {
      console.log("3333")
      return response.status(422).json(error);
    }
  }
);

module.exports = app;
