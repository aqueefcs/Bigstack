import React, { useState } from 'react';
import { GitBranch, Trash2, BarChart3, ChevronRight, ChevronDown } from 'lucide-react';

const Sidebar = ({ isOpen, repositories, selectedRepository, onRepositorySelect, onRepositoryDeleted }) => {
  const [expandedRepos, setExpandedRepos] = useState(new Set());

  const toggleRepoExpansion = (repoName) => {
    const newExpanded = new Set(expandedRepos);
    if (newExpanded.has(repoName)) {
      newExpanded.delete(repoName);
    } else {
      newExpanded.add(repoName);
    }
    setExpandedRepos(newExpanded);
  };

  const handleDelete = async (e, repositoryName) => {
    e.stopPropagation();
    
    if (!window.confirm(`Delete ${repositoryName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/repository/${repositoryName}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        onRepositoryDeleted(repositoryName);
      } else {
        alert('Error deleting repository: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting repository:', error);
      alert('Error deleting repository: ' + error.message);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Repositories</h2>
        <p className="text-sm text-gray-600">{repositories.length} available</p>
      </div>

      <div className="overflow-y-auto h-full pb-20">
        {repositories.length === 0 ? (
          <div className="p-4 text-center">
            <GitBranch className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No repositories yet</p>
          </div>
        ) : (
          <div className="p-2">
            {repositories.map((repo) => {
              const isSelected = selectedRepository === repo.repositoryName;
              const isExpanded = expandedRepos.has(repo.repositoryName);

              return (
                <div key={repo.repositoryName} className="mb-1">
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => onRepositorySelect(repo.repositoryName)}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <GitBranch className="w-4 h-4 mr-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {repo.repositoryName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {repo.totalChunks || 0} chunks
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRepoExpansion(repo.repositoryName);
                        }}
                        className="p-1 rounded hover:bg-gray-200"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => handleDelete(e, repo.repositoryName)}
                        className="p-1 rounded text-red-600 hover:bg-red-50"
                        title="Delete repository"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="ml-6 mt-2 space-y-1 text-xs text-gray-600">
                      {repo.repositoryUrl && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">URL:</span>
                          <span className="truncate">{repo.repositoryUrl}</span>
                        </div>
                      )}
                      
                      {repo.branch && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Branch:</span>
                          <span>{repo.branch}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        <span>{repo.totalChunks || 0} indexed chunks</span>
                      </div>
                      
                      {repo.lastUpdated && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Updated:</span>
                          <span>
                            {new Date(repo.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
