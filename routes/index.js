var express = require('express');
let { Octokit } = require('octokit')
var router = express.Router();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/', async function (req, res, next) {
  console.log(req.body);
  let githubLink = req.body.repository.url;
  let owner = githubLink.split('/')[3];
  let repo = githubLink.split('/')[4].slice(0, -4);

  console.log("hello")
  let securityAdvisories = await octokit.request(`GET /repos/${owner}/${repo}/security-advisories`, {
    owner: owner,
    repo: repo,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
  console.log(JSON.stringify(securityAdvisories.data));


  res.send({
    securityAdvisories: securityAdvisories.data.map(obj => {
      return { severity: obj.severity, summary: obj.summary }
    })
  });
});


module.exports = router;
