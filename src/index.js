const path = require("path");
const sqlite3 = require("sqlite3");
const sqlite = require("sqlite");
const express = require("express");
const port = 8080;
const bodyParser = require("body-parser");
const debug = require("debug")("app");
require("debug").enable("app");

(async () => {
  const db = await sqlite.open({
    filename: path.resolve(__dirname, "/tmp/database.db"),
    driver: sqlite3.Database
  });

  async function setupDb() {
    await db.run(`
      DROP TABLE IF EXISTS Students;
    `);

    await db.run(`
    CREATE TABLE IF NOT EXISTS Students (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Name VARCHAR(255)
    );`);

    const result = await db.run(`
    INSERT INTO Students (Name) 
    VALUES ('Steve'), ('Estinien'), ('Jack Sparrow');
    `);

    debug("Create Students table result %o", result);
  }

  function startApp() {
    const app = express();

    app.use(express.static("public"));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    //
    // req - request
    // - type (GET, POST, DELETE, UPDATE, PATCH, PUT)
    // - content-type (see below)
    // - body (json, x-www-formencoded)
    // - - values, data, etc
    // res - response
    // - status (200, 203, 204, 401, 302, 500) 200 - 299 OK!
    // - body (content)
    // - content-type (string/html, application/javascript, object/pdf)

    app.get("/", function (_req, res) {
      res.render("index.html");
    });

    app.get("/students", async (_req, res) => {
      const students = await db.all(`SELECT Id, Name FROM Students`);

      debug("Someone just fetched students: %O", students);

      res.json(students);
    });

    app.post("/create-student", (_req, res) => {
      debug(
        "Somebody just tried to post to the create-student endpoint: %o",
        _req.body
      );

      db.run(
        `
        INSERT INTO Students (Name) VALUES ($name);
      `,
        {
          $name: _req.body.studentName
        }
      );

      res.redirect("/");
    });

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  }

  await setupDb();
  startApp();
})();
