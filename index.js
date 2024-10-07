import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";

const app = express();
const port = 3000;
env.config();

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//global variables
const API_URL = "https://openlibrary.org";
var currentUserId = 0;
var username = "";
var sortBy = "dateDESC";

async function fetchBooks(user_id, sortBy) {
  var result = "";

  if (sortBy === "dateASC") {
    result = await db.query(
      "SELECT id, cover_id, title, author, notes, TO_CHAR(date_read, 'yyyy-mm-dd') AS date FROM books WHERE user_id = $1 ORDER BY date ASC",
      [user_id]
    );
  } else if (sortBy === "dateDESC") {
    result = await db.query(
      "SELECT id, cover_id, title, author, notes, TO_CHAR(date_read, 'yyyy-mm-dd') AS date FROM books WHERE user_id = $1 ORDER BY date DESC",
      [user_id]
    );
  }

  const books = result.rows;
  return books;
}

async function fetchUsers() {
  const result = await db.query("SELECT * FROM users");
  var users = [];
  result.rows.forEach((user) => {
    users.push(user);
  });
  return users;
}

app.get("/", async (req, res) => {
  const users = await fetchUsers();
  username = "Welcome";

  res.render("index.ejs", {
    title: username,
    users: users,
    isUserVerify: "false",
  });
});

app.post("/api/search", async (req, res) => {
  const q = req.body.q;

  try {
    const searchBy = "q";
    const limit = 5;
    const sort = "rating";

    var allCoverIds = [];
    var coverIds = [];

    console.log(
      API_URL + `/search.json/?${searchBy}=${q}&sort=${sort}&limit=${limit}`
    );

    const result = await axios.get(
      API_URL + `/search.json/?${searchBy}=${q}&sort=${sort}&limit=${limit}`
    );

    for (var i = 0; i < limit; i++) {
      allCoverIds.push(result.data.docs[i].cover_i);
    }

    coverIds = allCoverIds.filter((coverId) => coverId !== undefined);

    res.render("index.ejs", {
      title: username,
      coverIds: coverIds,
    });
  } catch (error) {
    console.log(error);

    res.render("index.ejs", {
      title: username,
      isUserVerify: "true",
      error: "Cannot find covers. Type another title.",
    });
  }
});

app.post("/book/add", async (req, res) => {
  const coverId = req.body.choosenCover;
  const title = req.body.title;
  const author = req.body.author;
  const notes = req.body.notes;
  const date = req.body.date;

  try {
    await db.query(
      "INSERT INTO books (cover_id, title, author, notes, date_read, user_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [coverId, title, author, notes, date, currentUserId]
    );

    res.redirect("/user");
  } catch (error) {
    console.log(error);

    const users = await fetchUsers();
    const books = await fetchBooks(currentUserId, sortBy);

    res.render("index.ejs", {
      title: username,
      users: users,
      books: books,
      isUserVerify: "true",
      error: "Error saving data. Try again.",
    });
  }
});

app.post("/book/edit/:id", async (req, res) => {
  const updatedBookId = req.params.id;
  const updatedTitle = req.body.updatedTitle;
  const updatedAuthor = req.body.updatedAuthor;
  const updatedNotes = req.body.updatedNotes;
  const updatedDate = req.body.updatedDate;

  try {
    await db.query(
      "UPDATE books SET title = $1, author = $2, notes = $3, date_read = $4 WHERE books.id = $5",
      [updatedTitle, updatedAuthor, updatedNotes, updatedDate, updatedBookId]
    );

    res.redirect("/user");
  } catch (error) {
    console.log(error);

    const users = await fetchUsers();
    const books = await fetchBooks(currentUserId, sortBy);

    res.render("index.ejs", {
      title: username,
      users: users,
      books: books,
      isUserVerify: "true",
      error: "Error saving data. Try again.",
    });
  }
});

app.post("/book/delete/:id", async (req, res) => {
  const deletedBookId = req.params.id;

  try {
    await db.query("DELETE FROM books WHERE books.id = $1", [deletedBookId]);

    res.redirect("/user");
  } catch (error) {
    console.log(error);

    const users = await fetchUsers();
    const books = await fetchBooks(currentUserId, sortBy);

    res.render("index.ejs", {
      title: username,
      users: users,
      books: books,
      isUserVerify: "true",
      error: "Error deleting data, try again.",
    });
  }
});

app.get("/user", async (req, res) => {
  const users = await fetchUsers();
  const books = await fetchBooks(currentUserId, sortBy);

  res.render("index.ejs", {
    title: username,
    books: books,
    users: users,
    isUserVerify: "true",
  });
});

app.post("/user", async (req, res) => {
  currentUserId = parseInt(req.body.user);

  const users = await fetchUsers();
  const books = await fetchBooks(currentUserId, sortBy);
  const user = users.find((user) => user.id === currentUserId);
  username = user.name;

  res.render("index.ejs", {
    title: username,
    books: books,
    users: users,
    isUserVerify: "true",
  });
});

app.post("/user/sort", async (req, res) => {
  sortBy = req.body.sortBy;

  const users = await fetchUsers();
  const books = await fetchBooks(currentUserId, sortBy);

  res.render("index.ejs", {
    title: username,
    books: books,
    users: users,
    isUserVerify: "true",
  });
});

app.post("/user/add", async (req, res) => {
  const users = await fetchUsers();

  try {
    //console.log(users.length);

    if (users.length < 5) {
      const lastUser = await db.query(
        "INSERT INTO users (name, color) VALUES ($1, $2) RETURNING *",
        [req.body.name, req.body.color]
      );

      currentUserId = parseInt(lastUser.rows[0].id);
      username = lastUser.rows[0].name;

      res.redirect("/user");
    } else {
      res.render("index.ejs", {
        title: username,
        users: users,
        isUserVerify: "false",
        error:
          "Unfortunately family is full. To add a new member, please remove one of the current members.",
      });
    }
  } catch (error) {
    console.log(error);

    const books = await fetchBooks(currentUserId, sortBy);

    res.render("index.ejs", {
      title: username,
      users: users,
      isUserVerify: "false",
      error:
        "Error adding user, try again. Make sure you don't duplicate a color.",
    });
  }
});

app.post("/user/delete/:id", async (req, res) => {
  const deletedUserId = req.params.id;

  try {
    await db.query("DELETE FROM books WHERE books.user_id = $1", [
      deletedUserId,
    ]);
    await db.query("DELETE FROM users WHERE users.id = $1", [deletedUserId]);

    username = "Welcome";

    res.redirect("/");
  } catch (error) {
    console.log(error);

    const users = await fetchUsers();
    const books = await fetchBooks(currentUserId, sortBy);

    res.render("index.ejs", {
      title: username,
      books: books,
      users: users,
      isUserVerify: "true",
      error: "Error deleting user, try again.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
