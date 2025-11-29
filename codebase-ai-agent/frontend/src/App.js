import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatInterface from './components/ChatInterface';
import RepositoryManager from './components/RepositoryManager';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [selectedRepository, setSelectedRepository] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    try {
      const response = await fetch('/api/repository/list');
      const data = await response.json();
      
      if (data.success) {
        setRepositories(data.data.repositories);
        if (data.data.repositories.length > 0 && !selectedRepository) {
          setSelectedRepository(data.data.repositories[0].repositoryName);
        }
      }
    } catch (error) {
      console.error('Error loading repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRepositoryAdded = (newRepo) => {
    setRepositories(prev => [...prev, newRepo]);
    setSelectedRepository(newRepo.repositoryName);
  };

  const handleRepositoryDeleted = (deletedRepoName) => {
    setRepositories(prev => prev.filter(repo => repo.repositoryName !== deletedRepoName));
    if (selectedRepository === deletedRepoName) {
      const remaining = repositories.filter(repo => repo.repositoryName !== deletedRepoName);
      setSelectedRepository(remaining.length > 0 ? remaining[0].repositoryName : null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Codebase AI Agent...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar
          isOpen={sidebarOpen}
          repositories={repositories}
          selectedRepository={selectedRepository}
          onRepositorySelect={setSelectedRepository}
          onRepositoryDeleted={handleRepositoryDeleted}
        />
        
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <Header
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            selectedRepository={selectedRepository}
          />
          
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route 
                path="/" 
                element={
                  <ChatInterface 
                    selectedRepository={selectedRepository}
                    repositories={repositories}
                  />
                } 
              />
              <Route 
                path="/repositories" 
                element={
                  <RepositoryManager 
                    repositories={repositories}
                    onRepositoryAdded={handleRepositoryAdded}
                    onRepositoryDeleted={handleRepositoryDeleted}
                    onRefresh={loadRepositories}
                  />
                } 
              />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
