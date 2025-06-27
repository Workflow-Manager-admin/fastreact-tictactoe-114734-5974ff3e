import React from "react";

// PUBLIC_INTERFACE
function StatusBar({ status }) {
  /** Renders game status at the top of the UI.
   * @param {string} status - Current game status/event string.
   */
  return (
    <div className="ttt-statusbar" aria-live="polite">{status}</div>
  );
}

export default StatusBar;
