import { useState } from "react";
import "./App.css";
import Site from "./Site/Site";
import History from "./History/History";
import Search from "./Search/Search";
import Settings from "./Settings/Settings";

export default function App() {
  const [activePage, setActivePage] = useState("site");

  const renderActivePage = () => { 
    switch (activePage) { //handle navbar buttons and where they navigate to
      case "site":
        return <Site />;
      case "history":
        return <History />;
      case "search":
        return <Search />; 
      case "settings":
        return <Settings />;
      default:
        return <Site/>; //when initially opened it goes to the site page
    }
  };

  return (
    <div className = "app-container">
      <div className = "content-area">{renderActivePage()}</div>
      {/*display of navbar buttons*/}
      <div className = "popup-nav"> 
        <button onClick={() => setActivePage("site")}>🔍 Site</button>
        <button onClick={() => setActivePage("history")}>📜 History</button>
        <button onClick={() => setActivePage("search")}>🔎 Search</button>
        <button onClick={() => setActivePage("settings")}>⚙️ Settings</button>
      </div>
    </div>
  )
}

