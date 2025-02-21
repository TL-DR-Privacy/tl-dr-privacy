import { FC } from "react";
import "./Settings.css";

const Settings: FC = () => {
    return (
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
    );
}

export default Settings;