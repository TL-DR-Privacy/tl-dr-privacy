// Site component that displays details for the "facebook.com" (currently hardcoded) site along with the permissions it requests
// This component informs users about the nature of the permissions and clarifies that accepting them is optional
// Authored by Nayyir and Mark

import { FC } from "react";
import "./Site.css";
import React from "react";

const Site: FC = () => {
  return (
    <div>
      <h2>Site: facebook.com</h2>
      <h3>Permissions requested</h3>
      <p>
        <strong>Location:</strong> This permission does... <br />
        You don’t <strong>need</strong> to accept this for the site to work.
      </p>
      <p>
        <strong>Camera:</strong> This does... <br />
        You don’t <strong>need</strong> ...
      </p>
    </div>
  );
};

export default Site;
