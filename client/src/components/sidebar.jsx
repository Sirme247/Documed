import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useStore from '../store/index.js';
import { 
  LayoutDashboard, 
  Users, 
  Hospital, 
  ClipboardList,
  FileText,
  Settings,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  Activity,
  UserCheck,
  Menu,
  X
} from 'lucide-react';
import './sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useStore((state) => state);
  const [expandedMenus, setExpandedMenus] = useState(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuConfig = {
    1: [
      {
        title: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard/global-admin'
      },
      {
        title: 'Hospitals',
        icon: Hospital,
        submenu: [
          { title: 'All Hospitals', path: '/hospitals/list' },
          { title: 'Register Hospital', path: '/hospitals/register' },
          // { title: 'Register Branch', path: '/hospitals/register-branch' }
        ]
      },
      {
        title: 'Users',
        icon: Users,
        // submenu: [
          title: 'All Users', path: '/users/list' ,
          // { title: 'Register User', path: '/users/register' },
          // { title: 'Register Existing Doctor', path: '/users/register-existing-doctor' }
        // ]
      },
      {
        title: 'Patients',
        icon: UserCheck,
        submenu: [
          { title: 'All Patients', path: '/patients/list' },
          { title: 'Register Patient', path: '/patients/register' },
        ]
      },
      {
        title: 'Profile',
        icon: User,
        
        path: '/profile/user' 
        
      },
      {
        title: 'Audit Logs',
        icon: ClipboardList,
        path: './audits/logs'
      }
    ],

    2: [
      {
        title: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard/local-admin'
      },
      {
        title: 'Users',
        icon: Users,
        submenu: [
          { title: 'Hospital Users', path: '/users/list' },
          { title: 'Register User', path: '/users/register' },
          { title: 'Register Existing Doctor', path: '/users/register-existing-doctor' }
        ]
      },
      {
        title: 'Patients',
        icon: UserCheck,
        submenu: [
          { title: 'All Patients', path: '/patients/list' },
          { title: 'Register Patient', path: '/patients/register' },
          { title: 'Admitted Patients', path: '/patients/frequent' }
        ]
      },
      {
        title: 'Visits',
        icon: ClipboardList,
        submenu: [
          // { title: 'New Visit', path: '/visits/new' },
          { title: "Today's Visits", path: '/visits/hospital/today' },
          { title: 'All Hospital Visits', path: '/visits/hospital/all' }  
        ]
      },
      {
        title: 'Hospital',
        icon: Hospital,
        path: '/hospitals/current/get-profile'
      },
     
      {
        title: 'Profile',
        icon: User,
        path: '/profile/user'
      }
    ],

    3: [
      {
        title: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard/doctor'
      },
      {
        title: 'Patients',
        icon: UserCheck,
        submenu: [
          { title: 'All Patients', path: '/patients/list' },
          { title: 'Register Patient', path: '/patients/register' },
          { title: 'Admitted Patients', path: '/patients/frequent' }
        ]
      },
      {
        title: 'Visits',
        icon: ClipboardList,
        submenu: [
          // { title: 'New Visit', path: '/visits/new' },
          { title: "Today's Visits", path: '/visits/hospital/today' },
          { title: 'All Hospital Visits', path: '/visits/hospital/all' }
        ]
      },
      // {
      //   title: 'Clinical Records',
      //   icon: FileText,
      //   submenu: [
      //     { title: 'Record Diagnosis', path: '/visits/record-diagnosis' },
      //     { title: 'Record Treatment', path: '/visits/record-treatment' },
      //     { title: 'Record Prescription', path: '/visits/record-prescriptions' },
      //     { title: 'Order Lab Tests', path: '/visits/record-lab-results' },
      //     { title: 'Order Imaging', path: '/visits/record-imaging-results' }
      //   ]
      // },
      {
        title: 'Profile',
        icon: User,
        path: '/profile/user'
      }
    ],

    4: [
      {
        title: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard/nurse'
      },
      {
        title: 'Patients',
        icon: UserCheck,
        submenu: [
          { title: 'All Patients', path: '/patients/list' },
          { title: 'Register Patient', path: '/patients/register' },
          { title: 'Admitted Patients', path: '/patients/frequent' }
        ]
      },
      {
        title: 'Visits',
        icon: ClipboardList,
        submenu: [
          { title: 'New Visit', path: '/visits/new' },
          { title: "Today's Visits", path: '/visits/hospital/today' },
          { title: 'All Hospital Visits', path: '/visits/hospital/all' }
        ]
      },
      {
        title: 'Profile',
        icon: User,
        path: '/profile/user'
      }
    ],

    5: [
      {
        title: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard/receptionist'
      },
      {
        title: 'Patients',
        icon: UserCheck,
        submenu: [
          { title: 'All Patients', path: '/patients/list' },
          { title: 'Register Patient', path: '/patients/register' },
          { title: 'Admitted Patients', path: '/patients/frequent' }
        ]
      },
      {
        title: 'Visits',
        icon: ClipboardList,
        submenu: [
          // { title: 'New Visit', path: '/visits/new' },
          { title: "Today's Visits", path: '/visits/hospital/today' },
          { title: 'All Hospital Visits', path: '/visits/hospital/all' }
        ]
      },
      {
        title: 'Profile',
        icon: User,
        path: '/profile/user'
      }
    ]
  };

  const menuItems = menuConfig[user?.role_id] || [];

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      isCollapsed ? '70px' : '280px'
    );
  }, [isCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      setExpandedMenus(new Set());
    }
  };

  const toggleSubmenu = (title) => {
    if (isCollapsed) return; 
    
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(title)) {
      newExpanded.delete(title);
    } else {
      newExpanded.add(title);
    }
    setExpandedMenus(newExpanded);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isSubmenuActive = (submenu) => {
    return submenu.some(item => location.pathname === item.path);
  };

  const handleSignOut = () => {
    navigate('/sign-out');
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Collapse Toggle Button */}
      <div className="sidebar-toggle">
        <button className="toggle-btn" onClick={toggleCollapse} title={isCollapsed ? 'Expand' : 'Collapse'}>
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* User Info Section */}
      {!isCollapsed && (
        <div className="sidebar-header">
          <div className="user-avatar">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.first_name} {user?.last_name}</div>
            <div className="user-role">
              {user?.role_id === 1 && 'System Admin'}
              {user?.role_id === 2 && 'Hospital Admin'}
              {user?.role_id === 3 && 'Medical Practitioner'}
              {user?.role_id === 4 && 'Medical Staff'}
              {user?.role_id === 5 && 'Non-Medical Staff'}
            </div>
          </div>
        </div>
      )}

      {isCollapsed && (
        <div className="sidebar-header-collapsed">
          <div className="user-avatar-collapsed">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div key={item.title} className="menu-item-wrapper">
            {item.submenu ? (
              <>
                <div
                  className={`menu-item ${isSubmenuActive(item.submenu) ? 'active' : ''}`}
                  onClick={() => isCollapsed ? null : toggleSubmenu(item.title)}
                  title={isCollapsed ? item.title : ''}
                >
                  <div className="menu-item-content">
                    <item.icon className="menu-icon" size={20} />
                    {!isCollapsed && <span className="menu-title">{item.title}</span>}
                  </div>
                  {!isCollapsed && (
                    expandedMenus.has(item.title) ? (
                      <ChevronDown className="menu-arrow" size={16} />
                    ) : (
                      <ChevronRight className="menu-arrow" size={16} />
                    )
                  )}
                </div>
                {!isCollapsed && expandedMenus.has(item.title) && (
                  <div className="submenu">
                    {item.submenu.map((subItem) => (
                      <div
                        key={subItem.path}
                        className={`submenu-item ${isActive(subItem.path) ? 'active' : ''}`}
                        onClick={() => handleNavigation(subItem.path)}
                      >
                        {subItem.title}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div
                className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
                title={isCollapsed ? item.title : ''}
              >
                <div className="menu-item-content">
                  <item.icon className="menu-icon" size={20} />
                  {!isCollapsed && <span className="menu-title">{item.title}</span>}
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Sign Out Button */}
      <div className="sidebar-footer">
        <div 
          className="menu-item signout-btn" 
          onClick={handleSignOut}
          title={isCollapsed ? 'Sign Out' : ''}
        >
          <div className="menu-item-content">
            <LogOut className="menu-icon" size={20} />
            {!isCollapsed && <span className="menu-title">Sign Out</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;