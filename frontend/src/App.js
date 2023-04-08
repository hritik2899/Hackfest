import './App.css';
import { useState, useEffect } from 'react';
import axios from "axios"
import calculateDownloadScore from './utils/downloadScore';




function App() {

  const [pkg, setPkg] = useState("");
  const [pkgSuggestions, setPkgSuggestions] = useState([]);
  const [pkgMetadata, setPkgMetadata] = useState();
  const [downloadScore, setDownloadScore] = useState(0);
  const [qualityScore, setQualityScore] = useState({});
  const [issueScore, setIssueScore] = useState();
  const [safelinkScore, setSafelinkScore] = useState();

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    const endpoint = `https://registry.npmjs.org/${pkg}`;
    const res = await fetch(endpoint);
    const data = await res.json();
    console.log(data);
    setPkgMetadata(data);
    // // let securityAdvisoriesRes = await axios.post("http://localhost:3000/security-advisories", { pkg: pkg, repository: data?.repository });
    let qualityRes = await axios.post("http://localhost:3000/quality", { pkg: pkg, repository: data?.repository });
    console.log(qualityRes);
    console.log(qualityRes.data.quality_report);
    setQualityScore(qualityRes.data.quality_report);
    let date = new Date();
    let downloadsRes = await axios.get(`https://api.npmjs.org/downloads/range/${date.getFullYear() - 1}-${date.getMonth()}-${date.getDate()}:${date.getFullYear()}-${date.getMonth()}-${date.getDate()}/${pkg}`)
    let dailyDownloads = downloadsRes.data.downloads;
    setDownloadScore(calculateDownloadScore(dailyDownloads));
    let issueAnalysisRes = await axios.post("http://localhost:3000/issue-analysis", { pkg: pkg, repository: data?.repository });
    setIssueScore(issueAnalysisRes.data.score);
    let safeLinkRes = await axios.post("http://localhost:3000/safelink-analysis", { pkg: pkg, repository: data?.repository });
    console.log(safeLinkRes);




    // console.log(securityAdvisoriesRes, qualityRes, dailyDownloads);

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
      <h1>PIP/NPM Package Analyser</h1>
      <div>
        <form style={{ display: "flex", alignItems: "center", justifyContent: "center" }} onSubmit={handleScanSubmit}>
          <div style={{ position: "relative", border: "2px solid red" }}>
            <input type="text" name="" id="" placeholder='Search Packages' value={pkg} onChange={handleInputChange} />
            <div style={{ position: 'absolute', border: "2px solid red" }} id="package_suggestion">
              {
                pkgSuggestions.map((item, index) => (
                  <div key={index} style={{ borderBottom: "2px solid grey" }} onClick={handleSuggestionItemClick}  >
                    {item.package?.name}
                  </div>
                ))
              }
            </div>
          </div>
          <button type="submit">Scan</button>
        </form>
      </div>
      {pkgMetadata && <div>
        <h1 style={{ textAlign: "left" }}>{pkgMetadata?.name}</h1>
        {pkgMetadata.author && <h2 style={{ textAlign: "left" }}>Author: {pkgMetadata?.author?.name}</h2>}
        <div style={{ textAlign: "left" }}>{pkgMetadata?.description}</div>
      </div>
      }

      <h1>Download Score: {downloadScore}/10</h1>
      <h1>Issue & PR analysis: {issueScore}/10</h1>
      <h1>Maintainance: {Number(qualityScore?.detail?.maintenance) * 10}/10</h1>
      <h1>Popularity: {Number(qualityScore?.detail?.popularity) * 10}/10</h1>
      <h1>Quality: {Number(qualityScore?.detail?.quality) * 10}/10</h1>



    </div>
  );
}

export default App;
