import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Popup from "./Popup"; // Import the new Popup component

function App() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const onclick = async () => {
    const [tab] = await chrome.tabs.query({ active: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: () => {
        alert("hello");
      },
    });
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>TLDR Privacy</h1>
      <div className="card">
        <button onClick={onclick}>Click Me</button>
        <button className="open-popup-btn" onClick={() => setIsPopupOpen(true)}>
          Open Popup
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

      {/* Render the popup only if isPopupOpen is true */}
      {isPopupOpen && <Popup onClose={() => setIsPopupOpen(false)} />}
    </>
  );
}

export default App;
