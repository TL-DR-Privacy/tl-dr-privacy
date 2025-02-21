import { FC } from "react";
import "./Search.css";

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
}

export default Search;