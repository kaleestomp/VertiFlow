import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="toggle-btn" onClick={toggleSidebar}>
        {isCollapsed ? '→' : '←'}
      </button>
      
      {!isCollapsed && (
        <nav className="sidebar-nav">
          <h2>Menu</h2>
          <ul>
            <li>
              <Link to="/">Page 1</Link>
            </li>
            <li>
              <Link to="/page2">Page 2</Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

export default Sidebar;
