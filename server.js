const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Movie, Review } = require("./models");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
app.use(express.json());

mongoose
  .connect("mongodb://127.0.0.1:27017/moviereviews")
  .then(() => {
    console.log("Connected");
  })
  .catch((err) => {
    console.error("Could not connect to MongoDB:", err);
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const authenticateJWT = (req, res, next) => {
  const token = req.headers["authorization"].replace("Bearer ", "");
  if (token) {
    console.log(token);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const defaultRole = "user";

  const user = new User({
    username,
    email,
    password: hashedPassword,
    role: defaultRole,
  });
  await user.save();
  res.status(201).send("User registered");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token });
  } else {
    res.status(401).send("Invalid credentials");
  }
});

app.post("/movies", authenticateJWT, async (req, res) => {
  const movie = new Movie(req.body);
  await movie.save();
  res.status(201).send(movie);
});

app.get("/movies", async (req, res) => {
  const movies = await Movie.find();
  res.json(movies);
});

app.get("/movies/:id", async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  res.json(movie);
});

app.put("/movies/:id", async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(movie);
});

app.delete("/movies/:id", async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

app.post("/reviews", authenticateJWT, async (req, res) => {
  const review = new Review({ ...req.body, userId: req.user.id });
  await review.save();
  res.status(201).send(review);
});

app.get("/reviews", async (req, res) => {
  const reviews = await Review.find();
  res.json(reviews);
});

app.get("/movies/:id/reviews", async (req, res) => {
  const reviews = await Review.find({ movieId: req.params.id });
  res.json(reviews);
});

app.get("/reviews/:id", async (req, res) => {
  const review = await Review.findById(req.params.id);
  res.json(review);
});

app.put("/reviews/:id", async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(review);
});

app.delete("/reviews/:id", async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
