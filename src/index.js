const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3");
const sqlite = require("sqlite");
const express = require("express");
const port = 8080;
const bodyParser = require("body-parser");
const debug = require("debug")("app");
require("debug").enable("app");

(async () => {
  const dbFilePath = path.join(__dirname, "../tmp/database.db");
  const dbFileRoot = path.dirname(dbFilePath);
  // let fileExists = false;
  // fs.readdirSync(dbFileRoot, function (err, files) {
  //   if (err) {
  //     debug.extend("error")("Error reading directory: %s", err.path);
  //     return;
  //   }

  //   debug("files: %o", files);
  //   if (files.indexOf(path.basename(dbFilePath)) >= 0) {
  //     fileExists = true;
  //   }
  // });

  // if (!fileExists) fs.writeFileSync(dbFilePath);

  debug("Mounting db at path: %s", dbFilePath);

  const db = await sqlite.open({
    filename: dbFilePath,
    driver: sqlite3.Database,
  });

  debug("Connected to db successfully");

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

    /// select
    app.get("/students", async (_req, res) => {
      const students = await db.all(`SELECT Id, Name FROM Students`);

      debug("Someone just fetched students: %O", students);

      res.json(students);
    });

    app.get("/students/:id", async (req, res) => {
      const result = await db.get(
        `SELECT Id, Name FROM Students WHERE Id = ${req.params.id}`
      );

      res.json(result);
    });

    /// insert or update
    app.post("/students", (req, res) => {
      debug(
        "Somebody just tried to post to the create-student endpoint: %o",
        req.body
      );

      db.run(
        `
        INSERT INTO Students (Name) VALUES ($name);
      `,
        {
          $name: req.body.studentName,
        }
      );

      res.redirect("/");
    });

    /// delete
    app.delete("/students/:id", async (req, res) => {
      debug("Deleting student with id: %s", req.params.id);
      try {
        const result = await db.run(
          `DELETE FROM Students
           WHERE Id = $id
          `,
          {
            $id: req.params.id,
          }
        );
        if (result.changes && result.changes > 0) {
          debug("Successfully deleted student with id: %s", req.params.id);
        } else {
          debug("Successfully deleted nothing!");
        }

        res.status(200).end();
      } catch (err) {
        debug.extend("error")("Error deleting record: %O", err);
        res.status(500).statusMessage(err.message).end();
      }
    });

    app.listen(port, () => {
      debug(`App started, go to: http://localhost:${port}`);
    });
  }

  await setupDb();
  startApp();
})();
