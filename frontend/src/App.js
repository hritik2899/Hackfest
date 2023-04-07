import './App.css';
import { useState } from 'react';
import axios from "axios"

function App() {

  const [pkg, setPkg] = useState("");

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    let res = await axios.post("http://localhost:3000/", { pkg: pkg })
    console.log(res);
  }

  return (
    <div className="App" >
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
      <h1>PIP/NPM Package Analyser</h1>
      <div>
        <form onSubmit={handleScanSubmit}>
          <div>
            <input type="text" name="" id="" onChange={(e) => setPkg(e.target.value)} />
            <label htmlFor=""></label>
          </div>
          <button type="submit">Scan</button>
        </form>
      </div>
    </div>
  );
}

export default App;
