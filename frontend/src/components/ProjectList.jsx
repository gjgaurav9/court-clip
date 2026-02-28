import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projects } from '../api/client';

export default function ProjectList() {
  const [projectList, setProjectList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setError(null);
      const data = await projects.list();
      setProjectList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const project = await projects.create({ name });
      setNewName('');
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await projects.delete(id);
      setProjectList((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-6">Projects</h2>

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New project name..."
          className="flex-1 bg-gray-800 rounded-lg px-4 py-2.5 text-sm text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          {creating ? 'Creating...' : 'Create'}
        </button>
      </form>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-2 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Project list */}
      {loading ? (
        <div className="text-gray-400 text-center py-12">Loading projects...</div>
      ) : projectList.length === 0 ? (
        <div className="text-gray-500 text-center py-12">
          No projects yet. Create one to get started.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {projectList.map((p) => (
            <div
              key={p.id}
              className="bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between hover:bg-gray-750 transition-colors group"
            >
              <div
                className="flex-1 cursor-pointer"
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <div className="font-medium text-white">{p.name}</div>
                <div className="text-xs text-gray-400 mt-0.5 flex gap-3">
                  {p.videoFilename && <span>{p.videoFilename}</span>}
                  <span>{p.annotationCount} annotation{p.annotationCount !== 1 ? 's' : ''}</span>
                  <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1 cursor-pointer"
                >
                  Open
                </button>
                {deleteConfirm === p.id ? (
                  <span className="flex gap-1">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-400 hover:text-red-300 text-xs px-2 py-1 cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-gray-400 text-xs px-2 py-1 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(p.id)}
                    className="text-red-400 hover:text-red-300 text-sm px-3 py-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
