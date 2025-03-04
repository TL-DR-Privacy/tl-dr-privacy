// This component displays a simple search interface for querying a site's policy
// Authored by Nayyir and Mark

import { FC } from "react";
import "./Search.css";
//import React from "react";

const Search: FC = () => {
  return (
    <div>
      <h2>Search for a site's policy</h2>
      <input
        type="text"
        placeholder="Search for a site/app"
        className="search-box"
      />
    </div>
  );
};

export default Search;
