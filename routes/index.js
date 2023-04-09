var express = require("express");
let { Octokit } = require("octokit");
var router = express.Router();
const axios = require('axios');
let cp = require('child_process');
let path = require('path');
let fs = require("fs")

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.post("/security-advisories", async function (req, res, next) {
  const packageName = "express";
  const packageVersion = "latest";

  const url = `https://registry.npmjs.org/${packageName}/${packageVersion}`;

  axios
    .get(url)
    .then((response) => {
      const advisories = response.data["npm-audit"].advisories;
      console.log(`Advisories for ${packageName}@${packageVersion}:`);
      console.log(advisories);
      // for (const advisoryId in advisories) {
      //   if (advisories.hasOwnProperty(advisoryId)) {
      //     const advisory = advisories[advisoryId];
      //     console.log(`- Advisory ${advisoryId}: ${advisory.title} (Severity: ${advisory.severity})`);
      //   }
      // }
    })
    .catch((error) => {
      console.error(error);
    });
});

router.post("/community-metrics", async function (req, res, next) {
  // Octokit.js
  
  // const owner = 'axios';
  // const repo = 'axios';

  // const community = await octokit.request(
  //   `GET /repos/${owner}/${repo}/community/profile`,
  //   {
  //     owner: "axios",
  //     repo: "axios",
  //     headers: {
  //       "X-GitHub-Api-Version": "2022-11-28",
  //     },
  //   }
  // );
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/community`;

// Set headers for authorization
const headers = {
  'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github+json'
};

// Fetch community metrics
axios.get(apiUrl, { headers })
  .then(response => {
    console.log('Community Metrics:', response.data);
    res.send({response})
  })
  .catch(error => {
    console.error('Error fetching community metrics:', error);
    res.send({a:6})
  });
});

router.post("/contributors", async function (req, res, next) {
  const owner = "axios";
  const repo = "axios";
  const contri = await octokit.request(
    `GET /repos/${owner}/${repo}/collaborators`,
    {
      owner: "axios",
      repo: "axios",
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  console.log(contri);

  // Define the GitHub repository owner and name you want to retrieve users from

  // Define the GitHub API endpoint for retrieving repository contributors
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contributors`;

  // Fetch the repository contributors from the GitHub API using Axios
  axios
    .get(apiUrl)
    .then((response) => {
      // Extract the user information from the contributors data
      const users = response.data.map((contributor) => {
        return {
          login: contributor.login,
          contributions: contributor.contributions,
        };
      });

      // Log the user information
      console.log(`Contributors to GitHub repository "${owner}/${repo}":`);
      console.log(users);
      res.send({ users });
    })
    .catch((error) => {
      console.error(error);
      res.send({ a: 5 });
    });
});

router.post("/safelink-analysis", async function (req, res, next) {
  let githubLink = req.body?.repository.url;
  let owner = githubLink.split("/")[3];
  let repo = githubLink.split("/")[4].slice(0, -4);
  let pkg = req.body.pkg;

  var npm = process.platform === "win32" ? "npm.cmd" : "npm";

  let urlAnalysisResult;
  try {
    require.resolve(pkg);
    console.log("installed");

    let malicousURL = 0;
    let safeURL = 0;
    const urls = [];
    var pathToModule = require.resolve(pkg);
    const source = fs.readFileSync(pathToModule, "utf8");
    const regex = /(https?:\/\/\S+)/g;
    let match;
    while ((match = regex.exec(source)) !== null) {
      urls.push(match[1]);
    }

    console.log(urls);
    await (async () => {
      for (let url of urls) {
        const apiKey =
          "f12f13f0ff1a117e253296ffd66d124eb7279f1dcb73f35dfc41e11b8bd06dbf";
        const apiUrl = `https://www.virustotal.com/vtapi/v2/url/report?apikey=${apiKey}&resource=${url}`;
        let response = await axios(apiUrl);
        console.log(url, response.data.response_code)
        if (response.data.response_code === 1)
          safeURL++;
        else
          malicousURL++;
      }
      console.log("hello bhao")
      res.send({ score: safeURL / (malicousURL + safeURL) * 10 })
      // console.log(malicousURL, safeURL)
    })().catch(err => {
      console.error(err);
    });


  } catch (err) {

    console.log(`${pkg} is not installed.`);
    cp.spawnSync(npm, ['install', `${pkg}`]);
    let malicousURL = 0;
    let safeURL = 0;
    const urls = [];
    var pathToModule = require.resolve(pkg);
    const source = fs.readFileSync(pathToModule, 'utf8');
    const regex = /(https?:\/\/\S+)/g;
    let match;
    while ((match = regex.exec(source)) !== null) {
      urls.push(match[1]);
    }

    console.log(urls);
    await (async () => {
      for (let url of urls) {
        const apiKey =
          "f12f13f0ff1a117e253296ffd66d124eb7279f1dcb73f35dfc41e11b8bd06dbf";
        const apiUrl = `https://www.virustotal.com/vtapi/v2/url/report?apikey=${apiKey}&resource=${url}`;
        let response = await axios(apiUrl);
        console.log(url, response.data.response_code)
        if (response.data.response_code === 1)
          safeURL++;
        else
          malicousURL++;
      }
      console.log("hello bhao")
      res.send({ score: safeURL / (malicousURL + safeURL) * 10 })
    })().catch(err => {
      console.error(err);
    });

    cp.spawnSync(npm, ['uninstall', `${pkg}`]);
  }


})
router.post('/issue-analysis', async function (req, res, next) {
  try {
    console.log(req.body);
    let githubLink = req.body?.repository.url;

    let owner = githubLink.split('/')[3];
    console.log(owner);

    let repo = githubLink.split('/')[4].slice(0, -4);
    console.log(repo)


    let issuesRes = await octokit.request(`GET /repos/${owner}/${repo}/issues?state=all&per_page=100`, {
      owner: owner,
      repo: repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    console.log(issuesRes)

    let openIssues = [];
    let closedIssues = [];

    let count = 0;


    console.log("a")
    while (issuesRes.headers.link.includes('rel="next"')) {
      for (const issue of issuesRes.data) {
        let state = issue.state;
        let id = issue.id;
        let created_at = new Date(issue.created_at.slice(0, 10)).getTime();
        let closed_at;
        let diff;
        let currDate;
        if (state !== "open") {
          closed_at = new Date(issue.closed_at?.slice(0, 10)).getTime();
          diff = closed_at - created_at;
          closedIssues.push({ created_at, closed_at, diff, id });
        } else {
          currDate = new Date().getTime();
          diff = currDate - created_at;
          openIssues.push({ created_at, id, diff });
        }
        console.log(state, diff);
      }
      count++;
      if (count === 10) break;
    }
    let timeOf1Day =
      new Date("2023-03-10").getTime() - new Date("2023-03-09").getTime();

    let score = 5;
    let vount = 0;

    // openIssues.sort((a, b) => a.diff < b.diff);
    // let medianDiff = openIssues[(openIssues.length / 2)].diff

    openIssues.forEach((issue) => {
      if (issue.diff <= timeOf1Day * 15) {
        score += 0;
        count++;
      } else if (issue.diff <= timeOf1Day * 45) score += 7.5;
      else if (issue.diff <= timeOf1Day * 90) {
        score += 4.5;
      } else if (issue.diff <= timeOf1Day * 150) score += 3;
      else if (issue.diff <= timeOf1Day * 210) score += 1;
    });

    closedIssues.forEach((issue) => {
      if (issue.diff <= timeOf1Day * 15) {
        score += 10;
      } else if (issue.diff <= timeOf1Day * 30) score += 9;
      else if (issue.diff <= timeOf1Day * 60) {
        score += 7;
      } else if (issue.diff <= timeOf1Day * 90) score += 6;
      else if (issue.diff <= timeOf1Day * 150) score += 5;
      else if (issue.diff <= timeOf1Day * 150) score += 4;
      else score += 2;
    });

    count = closedIssues.length + openIssues.length - count + 1;

    score = score / count;
    console.log(score);

    res.send({ score });
  } catch (error) {
    res.send({ score: 5.142 })
  }
});

router.post("/quality", function (req, res, next) {
  // Get the package name from the request body
  // const packageName = req.body.packageName;

  // Make API request to npms.io
  axios
    .get(`https://api.npms.io/v2/package/${req.body.pkg}`)
    .then((response) => {
      // Extract the score data from the API response
      const { score } = response.data;
      // score*=100;

      // Send the score data as the response
      res.send({ quality_report: score });
    })
    .catch((error) => {
      // Handle any errors that occur during the API request
      console.error(`Failed to fetch score data from npms.io: ${error}`);
      res
        .status(500)
        .send({ error: "Failed to fetch score data from npms.io" });
    });
});

module.exports = router;
