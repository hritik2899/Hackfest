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

router.post('/quality', function (req, res, next) {
  // Get the package name from the request body
  const packageName = req.body.packageName;

  // Make API request to npms.io
  axios.get(`https://api.npms.io/v2/package/react`)
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

  //  // Get the package name from the request body
  //  const packageName = req.body.packageName;

  //  // Make API requests to npms.io and Snyk API concurrently using Promise.all
  //  Promise.all([
  //    axios.get(`https://api.npms.io/v2/package/react`),
  //    axios.get(`https://snyk.io/api/v1/test/npm/react`)
  //  ])
  //    .then(([npmsResponse, snykResponse]) => {
  //      // Extract the score data from npms.io API response and convert to percentage
  //      const { score } = npmsResponse.data;
 
  //      // Extract the vulnerabilities data from Snyk API response
  //      const vulnerabilities = snykResponse.data.vulnerabilities;
 
  //      // Create an object to hold the combined data
  //      const scanReport = {
  //        score: score,
  //        vulnerabilities
  //      };
 
  //      // Send the combined data as the response
  //      res.send({ scan_report: scanReport });
  //    })
  //    .catch(error => {
  //      // Handle any errors that occur during the API requests
  //      console.error(`Failed to fetch data from APIs: ${error}`);
  //      res.status(500).send({ error: 'Failed to fetch data from APIs' });
  //    });

});




module.exports = router;
