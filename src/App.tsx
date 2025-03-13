// App.tsx Prologue Comments
// This component serves as the main hub for navigating between different pages of the app.
// Site, history, search and settings can be toggled between using the navbar
// Programmers: Nayyir and Mark
// Created 2/19/2025
// Edited 3/5/2025
// Preconditions: React development environment is set up. Site, History, Search and Setting exist in the correct path. App.css is availible for styling.
// Postconditions: The component renders the content of the page corresponding to the activePage state.
// Error and Exceptions: If activePage value is invalid, Site is the default component.
// Side effects: None
// Invariants: None
// Known Faults: None

import { useEffect, useState } from "react";
import "./App.css";
import Site from "./Site/Site";
import History from "./History/History";
import Search from "./Search/Search";
import Settings from "./Settings/Settings";
//import React from "react";

export default function App() {
  const [activePage, setActivePage] = useState("site");
  const [siteName, setSiteName] = useState("");
  const [fontSize, setFontSize] = useState(25);

  useEffect(() => {
    //get name of site the user is currently on
    if (activePage === "site") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = new URL(tabs[0].url || "");
        setSiteName(url.hostname);

        const length = url.hostname.length;
        if (length > 14) {
          //change font size of site page's title depending on length of url to avoid overflow
          setFontSize(20);
        } else {
          setFontSize(25);
        }
      });
    }
  }, [activePage]);

  const renderActivePage = () => {
    switch (
      activePage //handle navbar buttons and where they navigate to
    ) {
      case "site":
        return <Site />;
      case "history":
        return <History />;
      case "search":
        return <Search />;
      case "settings":
        return <Settings />;
      default:
        return <Site />; //when initially opened it goes to the site page
    }
  };

  //render page title in header section depending on which page open
  const renderPageTitle = () => {
    switch (activePage) {
      case "site":
        return `Site: ${siteName}`;
      case "history":
        return "History";
      case "search":
        return "Search";
      case "settings":
        return "Settings";
      default:
        return "";
    }
  };

  return (
    <div className="app-container">
      <div className="header-section">
        <div className="logo-container">
          <img src="128.png" alt="TLDR Privacy Logo" className="app-logo" />{" "}
          {/*adds logo to top*/}
        </div>
        {/*if the page is site then it uses the site-title css class and changes font size depending on url length
          else it uses the normal page-title format and font size */}
        <h2
          className={`page-title ${activePage === "site" ? "site-title" : ""}`}
          style={{ fontSize: activePage === "site" ? `${fontSize}px` : "25px" }}
        >
          {renderPageTitle()}
        </h2>
      </div>
      <div className="content-area">{renderActivePage()}</div>
      {/*display of navbar buttons*/}
      <div className="popup-nav">
        <button onClick={() => setActivePage("site")}>🔍 Site</button>
        <button onClick={() => setActivePage("history")}>📜 History</button>
        <button onClick={() => setActivePage("search")}>🔎 Search</button>
        <button onClick={() => setActivePage("settings")}>⚙️ Settings</button>
      </div>
    </div>
  );
}
