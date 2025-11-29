import React, { useState } from 'react';
import { Plus, Trash2, RefreshCw, GitBranch, Calendar, BarChart3, AlertCircle } from 'lucide-react';

const RepositoryManager = ({ repositories, onRepositoryAdded, onRepositoryDeleted, onRefresh }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    repositoryName: '',
    repositoryUrl: '',
    branch: 'main',
    localPath: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ingestionStatus, setIngestionStatus] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.repositoryName || (!formData.repositoryUrl && !formData.localPath)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/repository/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Start polling for ingestion status
        pollIngestionStatus(data.ingestionId);
        
        // Reset form
        setFormData({
          repositoryName: '',
          repositoryUrl: '',
          branch: 'main',
          localPath: ''
        });
        setShowAddForm(false);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error adding repository:', error);
      alert('Error adding repository: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pollIngestionStatus = async (ingestionId) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/repository/status/${ingestionId}`);
        const data = await response.json();

        if (data.success) {
          setIngestionStatus(prev => ({
            ...prev,
            [ingestionId]: data.data
          }));

          if (data.data.status === 'completed') {
            // Refresh repositories list
            setTimeout(() => {
              onRefresh();
              setIngestionStatus(prev => {
                const newStatus = { ...prev };
                delete newStatus[ingestionId];
                return newStatus;
              });
            }, 2000);
          } else if (data.data.status === 'failed') {
            // Stop polling on failure
            return;
          } else {
            // Continue polling
            setTimeout(poll, 2000);
          }
        }
      } catch (error) {
        console.error('Error polling ingestion status:', error);
      }
    };

    poll();
  };

  const handleDelete = async (repositoryName) => {
    if (!window.confirm(`Are you sure you want to delete ${repositoryName}? This will remove all indexed data.`)) {
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Repository Manager</h1>
          <p className="text-gray-600">Manage your codebase repositories and ingestion status</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onRefresh}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Repository
          </button>
        </div>
      </div>

      {/* Add Repository Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add New Repository</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repository Name *
                </label>
                <input
                  type="text"
                  value={formData.repositoryName}
                  onChange={(e) => setFormData({ ...formData, repositoryName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="my-awesome-project"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Git Repository URL
                </label>
                <input
                  type="url"
                  value={formData.repositoryUrl}
                  onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://github.com/user/repo.git"
                />
              </div>

              <div className="text-center text-gray-500 text-sm">OR</div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Local Path
                </label>
                <input
                  type="text"
                  value={formData.localPath}
                  onChange={(e) => setFormData({ ...formData, localPath: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/path/to/local/repository"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch
                </label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="main"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Repository'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ingestion Status */}
      {Object.keys(ingestionStatus).length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Ingestion Status</h2>
          <div className="space-y-3">
            {Object.entries(ingestionStatus).map(([ingestionId, status]) => (
              <div key={ingestionId} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900">Processing Repository</p>
                    <p className="text-sm text-blue-700">{status.message}</p>
                  </div>
                  <div className="flex items-center">
                    {status.status === 'processing' && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    )}
                    {status.status === 'completed' && (
                      <div className="text-green-600">✓ Completed</div>
                    )}
                    {status.status === 'failed' && (
                      <div className="text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Failed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repositories List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Repositories ({repositories.length})</h2>
        </div>

        {repositories.length === 0 ? (
          <div className="text-center py-12">
            <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No repositories yet</h3>
            <p className="text-gray-600 mb-4">
              Add your first repository to start using the AI assistant
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Repository
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {repositories.map((repo) => (
              <div key={repo.repositoryName} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <GitBranch className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {repo.repositoryName}
                        </h3>
                        {repo.repositoryUrl && (
                          <p className="text-sm text-gray-600">{repo.repositoryUrl}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-600">
                        <BarChart3 className="w-4 h-4 mr-1" />
                        {repo.totalChunks || 0} chunks
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(repo.lastUpdated || repo.createdAt)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(repo.repositoryName)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete repository"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RepositoryManager;
