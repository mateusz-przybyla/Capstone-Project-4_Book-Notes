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

app.get("/", async (req, res) => {
  const user_id = 1;
  const result = await db.query("SELECT * FROM books WHERE user_id = $1", [
    user_id,
  ]);

  const test = result.rows;

  console.log(test);

  res.render("index.ejs", {
    coverIds: coverIds,
  });
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

    for (var i = 0; i < limit; i++) {
      coverIds.push(result.data.docs[i].cover_i);
    }

    console.log(coverIds);

    res.redirect("/");
  } catch (error) {
    console.log(error);

    res.render("index.ejs", {
      error: "No results, try again.",
    });
  }
});

app.post("/add", (req, res) => {
  const coverId = req.body.choosenCover;
  const title = req.body.title;

  console.log(title);
  console.log(coverId);

  coverIds = [];
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
