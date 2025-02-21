import { FC } from "react";
import "./Site.css";

const Site: FC = () => {
    return (
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
    );
}

export default Site;