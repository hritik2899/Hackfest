var express = require('express');
let { Octokit } = require('octokit')
var router = express.Router();
const axios = require('axios');
let cp = require('child_process');
let path = require('path');
let fs = require("fs")

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/security-advisories', async function (req, res, next) {
  const packageName = 'express';
  const packageVersion = "latest";

  const url = `https://registry.npmjs.org/${packageName}/${packageVersion}`;

  axios.get(url)
    .then(response => {
      const advisories = response.data['npm-audit'].advisories;
      console.log(`Advisories for ${packageName}@${packageVersion}:`);
      console.log(advisories);
      // for (const advisoryId in advisories) {
      //   if (advisories.hasOwnProperty(advisoryId)) {
      //     const advisory = advisories[advisoryId];
      //     console.log(`- Advisory ${advisoryId}: ${advisory.title} (Severity: ${advisory.severity})`);
      //   }
      // }
    })
    .catch(error => {
      console.error(error);
    });


});

router.post('/safelink-analysis', async function (req, res, next) {
  let githubLink = req.body?.repository.url;
  let owner = githubLink.split('/')[3];
  let repo = githubLink.split('/')[4].slice(0, -4);
  let pkg = req.body.pkg;

  var npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';


  let checkURL = (pkgName) => {

    async function checkUrl(url) {
      const apiKey =
        "f12f13f0ff1a117e253296ffd66d124eb7279f1dcb73f35dfc41e11b8bd06dbf";
      const apiUrl = `https://www.virustotal.com/vtapi/v2/url/report?apikey=${apiKey}&resource=${url}`;
      axios(apiUrl).then((response) => {
        if (response.response_code === 1) {
          return 1
          // console.log("Malicious URL");
        } else {
          return 0
          // console.log("Safe URL");
        }
      });

    }

    function getUrls(packageName) {
      const urls = [];
      var pathToModule = require.resolve(packageName);
      const source = fs.readFileSync(pathToModule, 'utf8');
      const regex = /(https?:\/\/\S+)/g;
      let match;
      while ((match = regex.exec(source)) !== null) {
        urls.push(match[1]);
      }
      return urls;
    }



    let malicous = 0;
    let safe = 0;
    const utilForSafeUrls = () => {
      const urls = getUrls(pkgName);
      urls.forEach(url => {
        let x = checkUrl(url);
        if (x === 1) malicous++;
        else safe++;
      })
    }
    utilForSafeUrls();
    let score = safe / (safe + malicous) * 10;
    return score

  }



  let urlAnalysisResult;
  try {
    require.resolve(pkg);
    console.log("installed")
    urlAnalysisResult = checkURL(pkg);
  } catch (err) {
    console.log(`${pkg} is not installed.`);
    cp.spawnSync(npm, ['install', `${pkg}`]);
    urlAnalysisResult = checkURL(pkg);
    cp.spawnSync(npm, ['uninstall', `${pkg}`]);
  }

  res.send({ urlAnalysisResult })
})
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

  let count = 0;
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
    count++;
    if (count === 10)
      break;
  }
  let timeOf1Day = new Date('2023-03-10').getTime() - new Date('2023-03-09').getTime();

  let score = 5; let vount = 0;

  // openIssues.sort((a, b) => a.diff < b.diff);
  // let medianDiff = openIssues[(openIssues.length / 2)].diff

  openIssues.forEach((issue) => {
    if (issue.diff <= timeOf1Day * 15) {
      score += 0; count++;
    }

    else if (issue.diff <= timeOf1Day * 45)
      score += 7.5;

    else if (issue.diff <= timeOf1Day * 90) {
      score += 4.5
    }

    else if (issue.diff <= timeOf1Day * 150)
      score += 3;

    else if (issue.diff <= timeOf1Day * 210)
      score += 1;

  })

  closedIssues.forEach((issue) => {
    if (issue.diff <= timeOf1Day * 15) {
      score += 10;
    }

    else if (issue.diff <= timeOf1Day * 30)
      score += 9;

    else if (issue.diff <= timeOf1Day * 60) {
      score += 7;
    }

    else if (issue.diff <= timeOf1Day * 90)
      score += 6;

    else if (issue.diff <= timeOf1Day * 150)
      score += 5;

    else if (issue.diff <= timeOf1Day * 150) score += 4;
    else score += 2;

  })

  count = closedIssues.length + openIssues.length - count + 1;

  score = score / count;
  console.log(score);

  res.send({ score })
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
      res.send({ quality_report: score });
    })
    .catch(error => {
      // Handle any errors that occur during the API request
      console.error(`Failed to fetch score data from npms.io: ${error}`);
      res.status(500).send({ error: 'Failed to fetch score data from npms.io' });
    });
});






module.exports = router;
