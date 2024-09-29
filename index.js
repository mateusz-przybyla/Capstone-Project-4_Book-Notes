import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "book_notes",
  password: "", //delete!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  port: 5432,
});

db.connect();

const API_URL = "https://openlibrary.org";
var coverIds = [];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function fetchBooks(user_id) {
  const result = await db.query(
    "SELECT cover_id, title, author, notes, TO_CHAR(date_read, 'dd/mm/yyyy') AS date FROM books WHERE user_id = $1",
    [user_id]
  );
  const books = result.rows;

  return books;
}

app.get("/", async (req, res) => {
  const user_id = 1;
  const books = await fetchBooks(user_id);

  console.log(books);

  res.render("index.ejs", {
    coverIds: coverIds,
    books: books,
  });
});

app.get("/back", (req, res) => {
  coverIds = [];

  res.redirect("/");
});

app.post("/api/search", async (req, res) => {
  try {
    const searchBy = "q";
    const q = req.body.q;
    const limit = 5;
    const sort = "rating";
    coverIds = [];

    console.log(
      API_URL + `/search.json/?${searchBy}=${q}&sort=${sort}&limit=${limit}`
    );

    const result = await axios.get(
      API_URL + `/search.json/?${searchBy}=${q}&sort=${sort}&limit=${limit}`
    );
    const allCoverIds = [];
    for (var i = 0; i < limit; i++) {
      allCoverIds.push(result.data.docs[i].cover_i);
    }

    coverIds = allCoverIds.filter((coverId) => coverId !== undefined);
    console.log(coverIds);

    res.redirect("/");
  } catch (error) {
    console.log(error);

    res.render("index.ejs", {
      error: "No results, try again.",
    });
  }
});

app.post("/add", async (req, res) => {
  const coverId = req.body.choosenCover;
  const title = req.body.title;
  const author = req.body.author;
  const notes = req.body.notes;
  const date = req.body.date;
  const user_id = 1;

  console.log(coverId);
  console.log(title);
  console.log(author);
  console.log(notes);
  console.log(date);
  console.log(user_id);

  try {
    await db.query(
      "INSERT INTO books (cover_id, title, author, notes, date_read, user_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [coverId, title, author, notes, date, user_id]
    );

    res.redirect("/");
  } catch (error) {
    console.log(error);
    const books = await fetchBooks(user_id);

    res.render("index.ejs", {
      error: "Error saving data, try again.",
      books: books,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
