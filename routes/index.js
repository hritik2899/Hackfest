var express = require('express');
let { Octokit } = require('octokit')
var router = express.Router();
const axios = require('axios');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/security-advisories', async function (req, res, next) {
  console.log(req.body);
  try {
    let githubLink = req.body?.repository.url;
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
  } catch (error) {
    res.status(401).send({ message: "Record Not Found" })
  }
});

router.post('/issue-analysis', async function (req, res, next) {
  console.log(req.body);
  let githubLink = req.body?.repository.url;
  let owner = githubLink.split('/')[3];
  let repo = githubLink.split('/')[4].slice(0, -4);


  let issuesRes = await octokit.request(`GET /repos/${owner}/${repo}/issues?state=all&per_page=100`, {
    owner: owner,
    repo: repo,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })

  let openIssues = [];
  let closedIssues = [];
  // res.send(issuesRes.data);


  while (issuesRes.headers.link.includes('rel="next"')) {

    for (const issue of issuesRes.data) {
      let state = issue.state;
      let id = issue.id;
      let created_at = new Date(issue.created_at.slice(0, 10)).getTime();
      let closed_at;
      let diff;
      let currDate;
      if (state !== 'open') {
        closed_at = new Date(issue.closed_at?.slice(0, 10)).getTime();
        diff = closed_at - created_at;
        closedIssues.push({ created_at, closed_at, diff, id })
      } else {
        currDate = new Date().getTime();
        diff = currDate - created_at;
        openIssues.push({ created_at, id, diff });
      }
      console.log(state, diff)
    }
  }

  res.send({ issues: { openIssues, closedIssues } })
});

router.post('/quality', function (req, res, next) {
  // Get the package name from the request body
  // const packageName = req.body.packageName;

  // Make API request to npms.io
  axios.get(`https://api.npms.io/v2/package/${req.body.pkg}`)
    .then(response => {
      // Extract the score data from the API response
      const { score } = response.data;
      // score*=100;

      // Send the score data as the response
      res.send({ scan_report: score });
    })
    .catch(error => {
      // Handle any errors that occur during the API request
      console.error(`Failed to fetch score data from npms.io: ${error}`);
      res.status(500).send({ error: 'Failed to fetch score data from npms.io' });
    });
});




module.exports = router;
