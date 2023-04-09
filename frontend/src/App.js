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
  const [scanning, setScanning] = useState(false);

  const handleScanSubmit = async (e) => {

    e.preventDefault();
    setScanning(true);

    //getting package meta data
    const endpoint = `https://registry.npmjs.org/${pkg}`;
    const res = await fetch(endpoint);
    const data = await res.json();
    setPkgMetadata(data);  // setting metadata of package

    let securityAdvisoriesRes = await axios.post("http://localhost:3000/security-advisories", { pkg: pkg, repository: data?.repository });
    setSecurityAdvScore(securityAdvisoriesRes.data.score);

    // let qualityRes = await axios.post("http://localhost:3000/quality", { pkg: pkg, repository: data?.repository });
    // console.log(qualityRes);
    // console.log(qualityRes.data.quality_report);
    // setQualityScore(qualityRes.data.quality_report);
    // let date = new Date();
    // let downloadsRes = await axios.get(`https://api.npmjs.org/downloads/range/${date.getFullYear() - 1}-${date.getMonth()}-${date.getDate()}:${date.getFullYear()}-${date.getMonth()}-${date.getDate()}/${pkg}`)
    // let dailyDownloads = downloadsRes.data.downloads;
    // setDownloadScore(calculateDownloadScore(dailyDownloads));
    // let issueAnalysisRes = await axios.post("http://localhost:3000/issue-analysis", { pkg: pkg, repository: data?.repository });
    // setIssueScore(issueAnalysisRes.data.score);
    // let safeLinkRes = await axios.post("http://localhost:3000/safelink-analysis", { pkg: pkg, repository: data?.repository });
    // console.log(safeLinkRes);



    setScanning(false);
    // console.log(securityAdvisoriesRes, qualityRes, dailyDownloads);

  }
  const handleInputChange = async (e) => {
    console.log("Input")
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

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
        <ScoreCard label="Downloads Score" value={downloadScore} />
        <ScoreCard label="Security Advisory Score" value={securityAdvScore} />
        <ScoreCard label="Issues & PR Score" value={issueScore} />
        <ScoreCard label="Maintenence" value={Number(qualityScore?.detail?.maintenance) * 10} />
        <ScoreCard label="Popularity" value={Number(qualityScore?.detail?.popularity) * 10} />
        <ScoreCard label="Quality" value={Number(qualityScore?.detail?.quality) * 10} />
      </div>

    </div >
  );
}

export default App;
