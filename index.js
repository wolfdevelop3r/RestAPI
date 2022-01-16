const express = require('express');
const argon2 = require('argon2');
const app = express()
const PORT = 8080;

app.use(express.json());

const mysql = require('mysql');

var db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "testdb"
  });

db.connect(err => {
    console.log("Connected!");
});

app.get('/', (req, res) => {
    res.status(200).send(JSON.stringify({"status": 200, "error": null, "response": "RestAPI is functional"}))
})

//#region Posts
// Start of Posts Actions

app.get('/posts/:id', (req, res) => {
    const {id} = req.params;

    if(!id) {
        res.status(418).send(JSON.stringify({"status": 418, "error": "We need an ID", "response": null}))
    }
    else
    {
        db.query("SELECT * FROM posts WHERE id=? ORDER BY post_date DESC", [id], (err, results) => {
            if(err) throw err;
            if(results != "")
                res.status(200).send(JSON.stringify({"status": 200, "error": null, "response": results}));
            else
                res.status(200).send(JSON.stringify({"status": 204, "error": 'No post with that ID!', "response": null}));
          });
    }
})

app.get('/posts', (req, res) => {
    db.query("SELECT * FROM `posts` ORDER BY post_date DESC", (err, results) => {
        if(err) {
            res.status(418).send(JSON.stringify({"status": 418, "error": null, "response": "Something went wrong!"}));
        }
      res.status(200).send(JSON.stringify({"status": 200, "error": null, "response": results}));
    });
})

app.post('/posts', (req, res) => {
    const {username, description, image} = req.body;

    // INSERT INTO `posts` (`username`, `description`, `images`,  `likes`) VALUES (NULL, 'wolfie', 'This is a post', NULL, current_timestamp(), '0');
    db.query("INSERT INTO `posts` (`username`, `description`, `images`) VALUES (?, ?, ?)", [username, description, image], (err, results) => {
        if(err) {
            res.status(418).send(JSON.stringify({"status": 418, "error": null, "response": "Please fill in all the fields!"}));
        }
        res.status(200).send(JSON.stringify({"status": 200, "error": null, "response": "New Post Created"}))
    })
})

// End of Posts Actions
//#endregion

//#region Users
// Start of User Actions

app.get('/users', (req, res) => {
    db.query("SELECT * FROM users", (err, results) => {
        if(err) {
            res.status(418).send(JSON.stringify({"status": 418, "error": null, "response": "Something went wrong!"}));
        }
      res.status(200).send(JSON.stringify({"status": 200, "error": null, "response": results}));
    });
})

app.get('/users/:id', (req, res) => {
    const {id} = req.params;

    if(!id) {
        res.status(418).send(JSON.stringify({"status": 418, "error": "We need an ID", "response": null}))
    }
    else
    {
        db.query("SELECT * FROM users WHERE id=?", [id], (err, results) => {
            if(err) throw err;
            if(results != "")
                res.status(200).send(JSON.stringify({"status": 200, "error": null, "response": results}));
            else
                res.status(200).send(JSON.stringify({"status": 204, "error": null, "response": 'No user with that ID!'}));
          });
    }
})

app.patch('/users/', (req, res) => {
    const { email, password } = req.body; 

    if(!email || !password) {
        res.status(418).send(JSON.stringify({"status": 418, "error": "Please fill in the fields!", "response": null}))
    }
    else
    {
        db.query("SELECT * FROM users WHERE email=?", [email], (err, results) => {
            if(err) throw err;
            if(results != "")
                argon2.verify(results[0].password, password).then(argonMatch => {
                    if(argonMatch) {
                        res.status(200).send(JSON.stringify({"status": 200, "error": null, "response": {id: results[0].id}}));
                    }
                    else
                    {
                        res.status(200).send(JSON.stringify({"status": 200, "error": "Failed to login", "response": null}));
                    }
                });
            else{
                argon2.hash(password).then(hash => {
                    res.status(200).send(JSON.stringify({"status": 200, "error": null, "response": "User doesn't exist!"}));
                });
            }
        })
    }
});

app.post('/users/', (req, res) => {
    const { email, username, password } = req.body; 

    if(!email || !username || !password) {
        res.status(418).send(JSON.stringify({"status": 418, "error": "Please fill in the fields!", "response": null}))
    }
    else
    {
        db.query("SELECT * FROM users WHERE username=? OR email=?", [username, email], (err, results) => {
            if(err) throw err;
            if(results != "")
                res.status(200).send(JSON.stringify({"status": 200, "error": null, "response": "User already registered!"}));
            else{
                argon2.hash(password).then(hash => {
                    db.query("INSERT INTO `users`(`email`, `password`, `username`) VALUES (?, ?, ?)", [email, hash, username], (err, results) => {
                        res.status(200).send(JSON.stringify({"status": 200, "error": null, "response": "User registered!"}));
                    })
                });
            }
        })
    }
});

// End of User Actions
//#endregion

app.listen(
    PORT,
    () => {
        console.log(`Listening on port ${PORT}`)
    },
);
