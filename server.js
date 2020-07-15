const express = require("express");

const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const sessions = require("client-sessions");

mongoose.connect("mongodb://localhost/ss-auth");

let User = mongoose.model("User", new mongoose.Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true}
}));

let app = express();

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(sessions({
    cookieName: "session",
    secret: "whatever12345", // this should not be exposed for 'real' apps
    duration: 30 * 60 * 10000, // 30 mins
}));

app.set("view engine", "pug");

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    req.body.password = bcrypt.hashSync(req.body.password, 14);
    let user = new User(req.body);

    user.save((err) => {
        if (err) {
            let error = "Something bad happened, try again!";

            if (err.code === 11000) {
                error = "Email already taken, please try another";
            }

            return res.render("register", {error: error});
        }

        res.redirect("/dashboard");
    })
})

app.get("/dashboard", (req, res, next) => {
    if (!(req.session && req.session.userId)) {
        return res.redirect("/login");
    }

    User.findById(req.session.userId, (err, user) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.redirect("/login");
        }
        res.render("dashboard");
    })
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    User.findOne({email: req.body.email}, (err, user) => {
        if (err || !user || !bcrypt.compareSync(req.body.password, user.password)) {
            return res.render("login", {
                error: "Incorrect email / password."
            });
        }

        req.session.userId = user._id;
        res.redirect("/dashboard")
    })
});

app.listen(3000);