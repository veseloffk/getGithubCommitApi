const app = require('express')()
const bodyParser = require('body-parser')
const addRequestId = require('express-request-id')()
const GitHubApi = require('github')
const redis = require('redis')
const client = redis.createClient()

const github = new GitHubApi({
  host: 'api.github.com',
  protocol: 'https',
  headers: {
    'accept': 'application/vnd.github.v3+jso'
  }
})

function parseBodyToGetGommitObject (obj) {
  let result = {}
  result.repo = obj.repo
  result.owner = obj.owner
  result.since = new Date(obj.date).toISOString()
  let until = new Date(obj.date)
  until.setHours(23, 59, 59, 59)
  result.until = until.toISOString()
  if (obj.author) {
    result.author = obj.author
  }
  return result
};

app.use(addRequestId)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/start', function (req, res, next) {
  if (!req.body.owner) {
    res.status(400)
    res.send('Missing owner parameter')
  } else if (!req.body.repo) {
    res.status(400)
    res.send('Missing repo parameter')
  } else if (new Date(req.body.date).toDateString() === 'Invalid Date') {
    res.status(400)
    res.send('Bad data parameter')
  } else {
    next()
  }
})

app.use('/end', function (req, res, next) {
  if (!req.query['request_id']) {
    res.status(400)
    res.send('Missing request_id')
  } else {
    next()
  }
})

app.post('/start', function (req, res, next) {
  res.send(req.id)
  next()
}, function (req, res, next) {
  github.repos.getCommits(parseBodyToGetGommitObject(req.body), function (err, result) {
    if (err || !result) {
      res.status(500)
      res.send('Server error')
    } else if (result.meta.status === '200 OK') {
      if (req.body.author) {
        function sortCommitAuthor (commit) {
          return commit.author.login === req.body.author
        }
        result.data = result.data.filter(sortCommitAuthor)
      }
      client.hset('commits', req.id, JSON.stringify(result.data), redis.print)
    }
  })
})

app.get('/end', function (req, res, next) {
  client.hget('commits', req.query['request_id'], function (err, obj) {
    if (obj === null) {
      res.status(400)
      res.send('Unknown request_id')
    } else if (JSON.parse(obj).length === 0) {
      res.send('No info')
    } else {
      res.json(JSON.parse(obj))
      res.end()
    }
  })
})

app.listen(3000, function () {
  console.log('App start on port 3000')
  client.on('error', function (err) {
    console.log('Redis error: ' + err)
  })
})
