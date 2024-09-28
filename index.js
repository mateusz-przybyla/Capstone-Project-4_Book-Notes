import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

const API_URL = "https://openlibrary.org";

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

var coverIds = [];

app.get("/", (req, res) => {
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

    console.log(
      API_URL + `/search.json/?${searchBy}=${q}&sort=${sort}&limit=${limit}`
    );

    coverIds = [];

    const result = await axios.get(
      API_URL + `/search.json/?${searchBy}=${q}&sort=${sort}&limit=${limit}`
    );

    const sign = result.data.docs[0].cover_i;

    for (var i = 0; i < limit; i++) {
      coverIds.push(result.data.docs[i].cover_i);
    }

    console.log(coverIds);

    res.redirect("/");
  } catch (error) {
    console.log(error);
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
