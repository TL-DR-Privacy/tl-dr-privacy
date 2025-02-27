// Renders a static list of previously visited sites and their permission requests.
// Authored by Nayyir and Mark
// This will be taken out during the next sprint

import { FC } from "react";
import "./History.css";
import React from "react";

const History: FC = () => {
  return (
    <div>
      <h2>History</h2>
      <ul>
        <li>Facebook.com - 2/12/25 12:00 PM - requested x,y,z</li>
        <li>Snapchat (app) - 2/10/25 5:30 PM - requested x,y</li>
        <li>Twitter.com - 1/29/25 1:00 AM - requested y,z,a,b</li>
      </ul>
    </div>
  );
};

export default History;
