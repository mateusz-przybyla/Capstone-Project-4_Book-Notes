DROP TABLE IF EXISTS books, users;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(15) UNIQUE NOT NULL,
  color VARCHAR(15)
);

CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  cover_id VARCHAR(10) NOT NULL,
  title TEXT NOT NULL,
  author VARCHAR(50) NOT NULL,
  notes TEXT,
  date_read DATE NOT NULL,
  user_id INTEGER REFERENCES users(id)
);

INSERT INTO users (name, color) VALUES ('Mateusz', 'teal');

INSERT INTO books (cover_id, title, author, notes, date_read, user_id) VALUES ('12648183', 'Fifty Shades of Grey', 'E. L. James', ' Man-woman relationships, romance', '2024-05-05', 1);

SELECT *
FROM users
JOIN books
ON users.id = books.user_id;