import './SideCard.css';

export default function SideCard({ isCollapsed, onToggle }) {

    return (
        <aside
            className={`page1-secondary-sidebar ${isCollapsed ? 'collapsed' : ''}`}
            aria-label="Page 1 secondary sidebar"
        >
            <button
                type="button"
                className="sidecard-toggle-btn"
                onClick={onToggle}
                aria-label="toggle-page1-sidecard"
            >
                {isCollapsed ? '→' : '←'}
            </button>
            {!isCollapsed && <div className="page1-secondary-sidebar-title">
                SideCard Content
            </div>}
        </aside>
    );
}