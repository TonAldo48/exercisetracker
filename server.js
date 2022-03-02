const express = require('express')
const app = express()
const cors = require('cors')
var bodyParser = require('body-parser');
require('dotenv').config()
mongoose = require('mongoose');
mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });

app.use('/', bodyParser.urlencoded({ extended: false }));

const { Schema } = mongoose;

const usersSchema = new Schema({
  username: { type: String, required: true },
  count: Number,
  log: []
});

const User = mongoose.model("Users", usersSchema);

app.use(cors())

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users/:_id/exercises', function(req, res) {
  var { description, duration, date } = req.body;
  var _id = req.params._id;
  if (!!!date) {
    date = new Date();
    date = date.toDateString();
  } else {
    date = new Date(date);
    date = date.toDateString();
  }
  User.findById({ _id }, function(err, found) {
    if (err) return console.log(err);
    duration = parseInt(duration);
    found.log.push(
      {
        description: description,
        duration: duration,
        date: date
      });
    found.count = found.log.length;
    found.save(function(err, data) {
      if (err) return console.log(err);
      res.json({ username: data.username, description: description, duration, date, '_id': data._id });
    })
  })
});

app.get('/api/users/:_id/logs', (req, res) => {
  var _id = req.params._id;
  var from = new Date(req.query.from);
  var to = new Date(req.query.to);
  var limit = req.query.limit;

  console.log(`from is ${from.getTime()}`);
  console.log(`to is ${to.getTime()}`);
  console.log(`limit is ${limit}`);

  User.findById({ _id }, (err, found) => {
    if (err) return console.log(err);
    var logs = found.log;
    var retLog = [];

    if (isNaN(from) && isNaN(to)) {
      retLog = logs.slice(0, limit);
      res.json({
        _id: found._id,
        count: found.log.length,
        username: found.username,
        log: retLog,
      })
    } else if (!isNaN(from) && isNaN(to)) {
      logs.forEach(log => {
        var t = new Date(log.date);
        if (t.getTime() <= from.getTime()) {
          retLog.push(log)
        }
      })
      retLog = logs.slice(0, limit);
      from = from.toDateString();
      res.json({
        _id: found._id,
        username: found.username,
        from,
        count: limit,
        log: retLog,
      })
    } else if (isNaN(from) && !isNaN(to)) {
      logs.forEach(log => {
        var t = new Date(log.date);
        if (t.getTime() >= to.getTime()) {
          retLog.push(log);
        }
      })
      retLog = logs.slice(0, limit);
      to = to.toDateString();
      res.json({
        _id: found._id,
        username: found.username,
        to,
        count: limit,
        log: retLog,
      })
    } else if (!isNaN(from) && !isNaN(to)) {
      logs.forEach(log => {
        var t = new Date(log.date);
        if (t.getTime() >= to.getTime() &&
          t.getTime() <= from.getTime()
        ) {
          retLog.push(log);
        }
      })
      retLog = logs.slice(0, limit);
      res.json({
        _id: found._id,
        username: found.username,
        from,
        to,
        limit,
        log: retLog,
      })
    }
  })
})

app.route('/api/users')
  .post((req, res) => {
    var { username } = req.body;
    var user = new User({
      username: username,
      count: 0,
      log: [],
    })
    const saved = (err, data) => {
      if (err) return console.log(err);
      res.json({ username: username, '_id': data.id })
    }
    user.save(saved)
  })
  .get((req, res) => {
    User.find({}, function(err, users) {
      var userMap = [];
      var userDat;
      users.forEach(function(user) {
        userDat = { username: user.username, '_id': user._id }
        userMap.push(userDat);
      });
      res.send(userMap);
    });
  })

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
