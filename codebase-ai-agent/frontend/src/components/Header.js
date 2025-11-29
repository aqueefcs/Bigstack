import React from 'react';
import { Menu, Bot } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header = ({ sidebarOpen, setSidebarOpen, selectedRepository }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 mr-4"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center">
            <Bot className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Codebase AI Agent
              </h1>
              {selectedRepository && (
                <p className="text-sm text-gray-600">
                  Active: {selectedRepository}
                </p>
              )}
            </div>
          </div>
        </div>

        <nav className="flex space-x-4">
          <Link
            to="/"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/') 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Chat
          </Link>
          <Link
            to="/repositories"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/repositories') 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Repositories
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
