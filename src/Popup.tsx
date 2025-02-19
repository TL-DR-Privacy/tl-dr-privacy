import { useState } from "react";
import "./Popup.css";

// Define Props Type for Popup Component
interface PopupProps {
  onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ onClose }) => {
  const [activePage, setActivePage] = useState("site");

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-popup" onClick={onClose}>
          ✖
        </button>

        <div className="popup-content">
          {activePage === "site" && (
            <div>
              <h2>Site: facebook.com</h2>
              <h3>Permissions requested</h3>
              <p>
                <strong>Location:</strong> This permission does... <br />
                You don’t <strong>need</strong> to accept this for the site to
                work.
              </p>
              <p>
                <strong>Camera:</strong> This does... <br />
                You don’t <strong>need</strong> ...
              </p>
            </div>
          )}

          {activePage === "history" && (
            <div>
              <h2>History</h2>
              <ul>
                <li>Facebook.com - 2/12/25 12:00 PM - requested x,y,z</li>
                <li>Snapchat (app) - 2/10/25 5:30 PM - requested x,y</li>
                <li>Twitter.com - 1/29/25 1:00 AM - requested y,z,a,b</li>
              </ul>
            </div>
          )}

          {activePage === "search" && (
            <div>
              <h2>Search for a site's policy</h2>
              <input
                type="text"
                placeholder="Search for a site/app"
                className="search-box"
              />
            </div>
          )}

          {activePage === "settings" && (
            <div>
              <h2>Settings</h2>
              <p>Have TLDR Privacy auto-opt you out of the following:</p>
              <div className="checkbox-list">
                <label className="checkbox-item">
                  <input type="checkbox" /> Location
                </label>
                <label className="checkbox-item">
                  <input type="checkbox" /> Camera
                </label>
                <label className="checkbox-item">
                  <input type="checkbox" /> Microphone
                </label>
                <label className="checkbox-item">
                  <input type="checkbox" /> Notifications
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="popup-nav">
          <button onClick={() => setActivePage("site")}>🔍 Site</button>
          <button onClick={() => setActivePage("history")}>📜 History</button>
          <button onClick={() => setActivePage("search")}>🔎 Search</button>
          <button onClick={() => setActivePage("settings")}>⚙️ Settings</button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
