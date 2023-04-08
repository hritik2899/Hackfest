import './App.css';
import { useState, useEffect } from 'react';
import axios from "axios"




function App() {

  const [pkg, setPkg] = useState("");
  const [pkgSuggestions, setPkgSuggestions] = useState([]);
  const [pkgMetadata, setPkgMetadata] = useState();

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    const endpoint = `https://registry.npmjs.org/${pkg}`;
    const res = await fetch(endpoint);
    const data = await res.json();
    setPkgMetadata(data);
    let response = await axios.post("http://localhost:3000/", { pkg: pkg, repository: data?.repository })
    console.log(response);
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
                    {item.package.name}
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
        <h2 style={{ textAlign: "left" }}>Author: {pkgMetadata?.author.name}</h2>
        <div style={{ textAlign: "left" }}>{pkgMetadata?.description}</div>
      </div>
      }
    </div>
  );
}

export default App;
