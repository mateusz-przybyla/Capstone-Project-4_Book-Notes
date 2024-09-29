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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const API_URL = "https://openlibrary.org";

var user = "Mateusz Przybyła"; //temporary setting

async function fetchBooks(user_id) {
  const result = await db.query(
    "SELECT id, cover_id, title, author, notes, TO_CHAR(date_read, 'yyyy-mm-dd') AS date FROM books WHERE user_id = $1",
    [user_id]
  );
  const books = result.rows;

  return books;
}

app.get("/", async (req, res) => {
  const user_id = 1; //temporary setting

  const books = await fetchBooks(user_id);

  console.log(books);

  res.render("index.ejs", {
    title: user,
    books: books,
  });
});

app.post("/api/search", async (req, res) => {
  const user_id = 1; //temporary setting

  const q = req.body.q;
  const books = await fetchBooks(user_id);

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
    console.log(coverIds);

    res.render("index.ejs", {
      title: user,
      books: books,
      coverIds: coverIds,
    });
  } catch (error) {
    console.log(error);

    res.render("index.ejs", {
      title: user,
      books: books,
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

  const user_id = 1; //temporary setting

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
      title: user,
      books: books,
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

  const user_id = 1; //temporary setting

  try {
    await db.query(
      "UPDATE books SET title = $1, author = $2, notes = $3, date_read = $4 WHERE books.id = $5",
      [updatedTitle, updatedAuthor, updatedNotes, updatedDate, updatedBookId]
    );

    res.redirect("/");
  } catch (error) {
    console.log(error);
    const books = await fetchBooks(user_id);

    res.render("index.ejs", {
      title: user,
      books: books,
      error: "Error saving data. Try again.",
    });
  }
});

app.post("/book/delete/:id", async (req, res) => {
  const deletedBookId = req.params.id;

  const user_id = 1; //temporary setting

  try {
    await db.query("DELETE FROM books WHERE books.id = $1", [deletedBookId]);

    res.redirect("/");
  } catch (error) {
    console.log(error);
    const books = await fetchBooks(user_id);

    res.render("index.ejs", {
      title: user,
      error: "Error deleting data, try again.",
      books: books,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
