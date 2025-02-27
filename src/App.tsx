// App.tsx
// This component serves as the main hub for navigating between different pages of the app.
// Site, history, search and settings can be toggled between using the navbar
// Programmers: Nayyir and Mark
// Created 2/19/2025
// Edited 2/27/2025
// Preconditions: React development environment is set up. Site, History, Serach and Setting exist in the correct path. App.css is availible for styling.
// Postconditions: The component renders the content of the page corresponding to the activePage state.
// Error and Exceptions: If activePage value is invalid, Site is the default component.
// Side effects:
// Invariants:
// Known Faults:

import { useState } from "react";
import "./App.css";
import Site from "./Site/Site";
import History from "./History/History";
import Search from "./Search/Search";
import Settings from "./Settings/Settings";
import React from "react";

export default function App() {
  const [activePage, setActivePage] = useState("site");

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

  return (
    <div className="app-container">
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
