import './App.css';
import { useState, useEffect } from 'react';
import axios from "axios"
import calculateDownloadScore from './utils/downloadScore';

import ScoreCard from './components/ScoreCard';



function App() {

  const [pkg, setPkg] = useState("");
  const [pkgSuggestions, setPkgSuggestions] = useState([]);
  const [pkgMetadata, setPkgMetadata] = useState();
  const [downloadScore, setDownloadScore] = useState(0);
  const [qualityScore, setQualityScore] = useState({});
  const [issueScore, setIssueScore] = useState();
  const [safelinkScore, setSafelinkScore] = useState();
  const [securityAdvScore, setSecurityAdvScore] = useState();
  const [communityMetrics, setCommunityMetrics] = useState();
  const [commitFrequencyScore, setCommitFrequencyScore] = useState();
  const [finalScore, setFinalScore] = useState();
  const [scanning, setScanning] = useState(false);

  const handleScanSubmit = async (e) => {

    e.preventDefault();

    //getting package meta data
    const endpoint = `https://registry.npmjs.org/${pkg}`;
    const res = await fetch(endpoint);
    const data = await res.json();
    setPkgMetadata(data);  // setting metadata of package

    //  downloads
    let date = new Date();
    let downloadsRes = await axios.get(`https://api.npmjs.org/downloads/range/${date.getFullYear() - 1}-${date.getMonth()}-${date.getDate()}:${date.getFullYear()}-${date.getMonth()}-${date.getDate()}/${pkg}`)
    let dailyDownloads = downloadsRes.data.downloads;
    setDownloadScore(calculateDownloadScore(dailyDownloads));

    // security adv
    let securityAdvisoriesRes = await axios.post("http://localhost:3000/security-advisories", { pkg: pkg, repository: data?.repository });
    setSecurityAdvScore(securityAdvisoriesRes.data.score);

    // quality adv
    let qualityRes = await axios.post("http://localhost:3000/quality", { pkg: pkg, repository: data?.repository });
    setQualityScore(qualityRes.data.quality_report);
    // issue analysis
    let issueAnalysisRes = await axios.post("http://localhost:3000/issue-analysis", { pkg: pkg, repository: data?.repository });
    setIssueScore(issueAnalysisRes.data.score);
    // safe links analysis 
    let safeLinkRes = await axios.post("http://localhost:3000/safelink-analysis", { pkg: pkg, repository: data?.repository });
    setSafelinkScore(safeLinkRes.data.score);

    let communityMetricRes = await axios.post("http://localhost:3000/community-metrics", { pkg: pkg, repository: data?.repository })
    setCommunityMetrics(communityMetricRes.data.score);

    let commitFrequencyRes = await axios.post("http://localhost:3000/frequencyanalysis", { pkg: pkg, repository: data?.repository })
    setCommitFrequencyScore(commitFrequencyRes.data.score);

    let finalScoreUtil = 0;
    finalScoreUtil += 0.15 * calculateDownloadScore(dailyDownloads);
    console.log(finalScoreUtil);
    finalScoreUtil += 0.20 * securityAdvisoriesRes.data.score;
    console.log(finalScoreUtil);

    finalScoreUtil += 0.05 * qualityRes.data.quality_report.detail.maintenance * 10
    console.log(finalScoreUtil);
    finalScoreUtil += 0.05 * qualityRes.data.quality_report.detail.popularity * 10
    console.log(finalScoreUtil);
    finalScoreUtil += 0.05 * qualityRes.data.quality_report.detail.quality * 10
    console.log(finalScoreUtil);
    finalScoreUtil += 0.10 * issueAnalysisRes.data.score
    console.log(finalScoreUtil);
    finalScoreUtil += 0.15 * safeLinkRes.data.score
    console.log(finalScoreUtil);
    finalScoreUtil += 0.15 * communityMetricRes.data.score
    console.log(finalScoreUtil);
    finalScoreUtil += 0.10 * commitFrequencyRes.data.score
    console.log(finalScoreUtil);

    setFinalScore(finalScoreUtil)
    setScanning(true);



  }
  const handleInputChange = async (e) => {
    e.preventDefault();
    setPkg(e.target.value);
    const endpoint = `https://registry.npmjs.org/-/v1/search?text=${e.target.value}`;
    const res = await fetch(endpoint);
    const data = await res.json();
    console.log(data)
    setPkgSuggestions(data.objects);
  }

  const handleSuggestionItemClick = (e) => {
    setPkg(e.target.innerText);
    setPkgSuggestions([])
  }


  return (
    <div className="App" >

      <h1 style={{ backgroundColor: "steelblue", color: "white", textAlign: "left", width: "100%", padding: "12px", margin: '0', marginBottom: "12px", fontWeight: "normal", fontSize: "24px", fontFamily: "sans-serif" }}>PIP/NPM Package Analyser</h1>
      <div style={{ padding: "12px", display: "flex", flexDirection: "column" }}>
        <form style={{ display: "flex", width: "100%", height: "auto" }} onSubmit={handleScanSubmit}>
          <div style={{ position: "relative", display: "flex", padding: "12px", width: "100%" }}>


            <input style={{ width: "100%", height: "1.5rem" }} type="text" placeholder='Search Packages' value={pkg} onChange={handleInputChange} />


            <div style={{ position: 'absolute', border: "2px solid grey", background: "black", color: "white", top: "3rem" }} id="package_suggestion">
              {
                pkgSuggestions.map((item, index) => (
                  <div key={index} style={{ borderBottom: "2px solid grey", padding: "2px" }} onClick={handleSuggestionItemClick}  >
                    {item.package?.name}
                  </div>
                ))
              }
            </div>
          </div>
          <button style={{ fontSize: "20px", backgroundColor: "steelblue", color: "white", border: "0", outline: "0", padding: "0px 20px", borderRadius: "8px" }} type="submit">Scan</button>
        </form>
      </div>



      {pkgMetadata && <div>
        <h2>Package Name: {pkgMetadata?.name}</h2>
        {pkgMetadata.author && <h3>Author Name: {pkgMetadata?.author?.name}</h3>}
        <h3>{pkgMetadata?.description}</h3>
      </div>}
      {scanning &&
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
          <ScoreCard label="Final Score" value={finalScore} />
          <ScoreCard label="Downloads Score" value={downloadScore} />
          <ScoreCard label="Security Advisory Score" value={securityAdvScore} />
          <ScoreCard label="Issues & PR Score" value={issueScore} />
          <ScoreCard label="Maintenence" value={Number(qualityScore?.detail?.maintenance) * 10} />
          <ScoreCard label="Popularity" value={Number(qualityScore?.detail?.popularity) * 10} />
          <ScoreCard label="Quality" value={Number(qualityScore?.detail?.quality) * 10} />
          <ScoreCard label="Community Metric" value={communityMetrics} />
          <ScoreCard label="Commit & PR Frequency Score" value={commitFrequencyScore} />
          <ScoreCard label="Safe Links Score" value={safelinkScore} />
        </div>
      }

    </div >
  );
}

export default App;
