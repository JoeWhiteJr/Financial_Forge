import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  FileText,
  Monitor,
  BookOpen,
  Users,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Check,
  Upload,
  RefreshCw,
  AlertTriangle,
  Database,
  File,
} from 'lucide-react';
import { pagesApi, bloombergApi, booksApi, usersApi, ingestApi, chatApi } from '../services/api';
import MarkdownEditor from '../components/editor/MarkdownEditor';

const tabs = [
  { key: 'content', label: 'Content', icon: FileText },
  { key: 'bloomberg', label: 'Bloomberg', icon: Monitor },
  { key: 'reading', label: 'Reading List', icon: BookOpen },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'ingestion', label: 'Ingestion', icon: Upload },
];

/* ------------------------------------------------------------------ */
/*  Content Tab                                                        */
/* ------------------------------------------------------------------ */
function ContentTab() {
  const [pages, setPages] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    pagesApi.list().then(({ data: res }) => {
      const list = res.success ? res.data : Array.isArray(res) ? res : [];
      setPages(list);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedSlug) return;
    setLoading(true);
    setMsg(null);
    pagesApi
      .get(selectedSlug)
      .then(({ data: res }) => {
        if (res.success) {
          setTitle(res.data.title || '');
          setContent(res.data.content || '');
        }
      })
      .catch(() => setMsg({ type: 'error', text: 'Failed to load page' }))
      .finally(() => setLoading(false));
  }, [selectedSlug]);

  const handleSave = async () => {
    if (!selectedSlug) return;
    setSaving(true);
    setMsg(null);
    try {
      await pagesApi.update(selectedSlug, { title, content });
      setMsg({ type: 'success', text: 'Page saved successfully' });
    } catch {
      setMsg({ type: 'error', text: 'Failed to save page' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <select
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forge-500 text-sm"
        >
          <option value="">Select a page...</option>
          {pages.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.title || p.slug}
            </option>
          ))}
        </select>

        {selectedSlug && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-forge-900 rounded-lg font-medium text-sm hover:bg-amber-400 disabled:opacity-50 transition-colors"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      {msg && (
        <div
          className={`p-3 rounded-lg text-sm ${
            msg.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="text-forge-500 py-8 text-center">Loading...</div>
      ) : selectedSlug ? (
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page title"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forge-500 text-sm font-semibold"
          />
          <MarkdownEditor value={content} onChange={setContent} />
        </div>
      ) : (
        <div className="text-gray-400 py-8 text-center text-sm">
          Select a page to edit its content
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bloomberg Tab                                                      */
/* ------------------------------------------------------------------ */
const emptyCommand = { command: '', name: '', description: '', category: '', when_to_use: '', related_commands: [] };

function BloombergTab() {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [form, setForm] = useState({ ...emptyCommand });
  const [msg, setMsg] = useState(null);

  const fetchCommands = useCallback(() => {
    setLoading(true);
    bloombergApi
      .list()
      .then(({ data: res }) => {
        const list = res.success ? res.data : Array.isArray(res) ? res : [];
        setCommands(list);
      })
      .catch(() => setCommands([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCommands(); }, [fetchCommands]);

  const startEdit = (cmd) => {
    setEditing(cmd.id);
    setForm({
      command: cmd.command || '',
      name: cmd.name || '',
      description: cmd.description || '',
      category: cmd.category || '',
      when_to_use: cmd.when_to_use || '',
      related_commands: cmd.related_commands || [],
    });
    setMsg(null);
  };

  const startNew = () => {
    setEditing('new');
    setForm({ ...emptyCommand });
    setMsg(null);
  };

  const cancel = () => {
    setEditing(null);
    setForm({ ...emptyCommand });
  };

  const handleSave = async () => {
    setMsg(null);
    const payload = {
      ...form,
      related_commands:
        typeof form.related_commands === 'string'
          ? form.related_commands.split(',').map((s) => s.trim()).filter(Boolean)
          : form.related_commands,
    };

    try {
      if (editing === 'new') {
        await bloombergApi.create(payload);
        setMsg({ type: 'success', text: 'Command created' });
      } else {
        await bloombergApi.update(editing, payload);
        setMsg({ type: 'success', text: 'Command updated' });
      }
      setEditing(null);
      setForm({ ...emptyCommand });
      fetchCommands();
    } catch {
      setMsg({ type: 'error', text: 'Failed to save command' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this command?')) return;
    try {
      await bloombergApi.delete(id);
      setMsg({ type: 'success', text: 'Command deleted' });
      fetchCommands();
    } catch {
      setMsg({ type: 'error', text: 'Failed to delete command' });
    }
  };

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Bloomberg Commands ({commands.length})
        </h3>
        <button
          onClick={startNew}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-forge-900 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
        >
          <Plus size={16} />
          Add Command
        </button>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-lg text-sm ${
            msg.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Inline form */}
      {editing !== null && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Command (e.g. EQ)"
              value={form.command}
              onChange={(e) => updateField('command', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forge-500"
            />
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forge-500"
            />
            <input
              placeholder="Category"
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forge-500"
            />
            <input
              placeholder="Related commands (comma-separated)"
              value={
                Array.isArray(form.related_commands)
                  ? form.related_commands.join(', ')
                  : form.related_commands
              }
              onChange={(e) => updateField('related_commands', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forge-500"
            />
          </div>
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-forge-500"
          />
          <textarea
            placeholder="When to use"
            value={form.when_to_use}
            onChange={(e) => updateField('when_to_use', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-forge-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-forge-900 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
            >
              <Check size={16} />
              {editing === 'new' ? 'Create' : 'Update'}
            </button>
            <button
              onClick={cancel}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-forge-500 py-8 text-center">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="pb-2 font-semibold text-forge-700">Command</th>
                <th className="pb-2 font-semibold text-forge-700">Name</th>
                <th className="pb-2 font-semibold text-forge-700">Category</th>
                <th className="pb-2 font-semibold text-forge-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {commands.map((cmd) => (
                <tr key={cmd.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 font-mono text-forge-600">{cmd.command}</td>
                  <td className="py-2.5 text-gray-700">{cmd.name}</td>
                  <td className="py-2.5">
                    {cmd.category && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {cmd.category}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => startEdit(cmd)}
                      className="p-1.5 text-gray-400 hover:text-forge-600 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(cmd.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {commands.length === 0 && (
            <div className="text-gray-400 py-8 text-center text-sm">
              No commands yet. Add one above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reading List Tab                                                   */
/* ------------------------------------------------------------------ */
const emptyBook = { title: '', author: '', category: '', difficulty: 'Beginner', summary: '', why_it_matters: '' };

function ReadingTab() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyBook });
  const [msg, setMsg] = useState(null);

  const fetchBooks = useCallback(() => {
    setLoading(true);
    booksApi
      .list()
      .then(({ data: res }) => {
        const list = res.success ? res.data : Array.isArray(res) ? res : [];
        setBooks(list);
      })
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const startEdit = (book) => {
    setEditing(book.id);
    setForm({
      title: book.title || '',
      author: book.author || '',
      category: book.category || '',
      difficulty: book.difficulty || 'Beginner',
      summary: book.summary || '',
      why_it_matters: book.why_it_matters || '',
    });
    setMsg(null);
  };

  const startNew = () => {
    setEditing('new');
    setForm({ ...emptyBook });
    setMsg(null);
  };

  const cancel = () => {
    setEditing(null);
    setForm({ ...emptyBook });
  };

  const handleSave = async () => {
    setMsg(null);
    try {
      if (editing === 'new') {
        await booksApi.create(form);
        setMsg({ type: 'success', text: 'Book created' });
      } else {
        await booksApi.update(editing, form);
        setMsg({ type: 'success', text: 'Book updated' });
      }
      setEditing(null);
      setForm({ ...emptyBook });
      fetchBooks();
    } catch {
      setMsg({ type: 'error', text: 'Failed to save book' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await booksApi.delete(id);
      setMsg({ type: 'success', text: 'Book deleted' });
      fetchBooks();
    } catch {
      setMsg({ type: 'error', text: 'Failed to delete book' });
    }
  };

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Books ({books.length})
        </h3>
        <button
          onClick={startNew}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-forge-900 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
        >
          <Plus size={16} />
          Add Book
        </button>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-lg text-sm ${
            msg.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Inline form */}
      {editing !== null && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forge-500"
            />
            <input
              placeholder="Author"
              value={form.author}
              onChange={(e) => updateField('author', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forge-500"
            />
            <input
              placeholder="Category"
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forge-500"
            />
            <select
              value={form.difficulty}
              onChange={(e) => updateField('difficulty', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forge-500"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <textarea
            placeholder="Summary"
            value={form.summary}
            onChange={(e) => updateField('summary', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-forge-500"
          />
          <textarea
            placeholder="Why it matters"
            value={form.why_it_matters}
            onChange={(e) => updateField('why_it_matters', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-forge-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-forge-900 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
            >
              <Check size={16} />
              {editing === 'new' ? 'Create' : 'Update'}
            </button>
            <button
              onClick={cancel}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-forge-500 py-8 text-center">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="pb-2 font-semibold text-forge-700">Title</th>
                <th className="pb-2 font-semibold text-forge-700">Author</th>
                <th className="pb-2 font-semibold text-forge-700">Category</th>
                <th className="pb-2 font-semibold text-forge-700">Difficulty</th>
                <th className="pb-2 font-semibold text-forge-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 font-medium text-forge-700">{book.title}</td>
                  <td className="py-2.5 text-gray-600">{book.author}</td>
                  <td className="py-2.5">
                    {book.category && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {book.category}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5">
                    {book.difficulty && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          book.difficulty === 'Beginner'
                            ? 'bg-green-100 text-green-700'
                            : book.difficulty === 'Intermediate'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {book.difficulty}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => startEdit(book)}
                      className="p-1.5 text-gray-400 hover:text-forge-600 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(book.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {books.length === 0 && (
            <div className="text-gray-400 py-8 text-center text-sm">
              No books yet. Add one above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Users Tab                                                          */
/* ------------------------------------------------------------------ */
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', is_admin: false });
  const [msg, setMsg] = useState(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    usersApi
      .list()
      .then(({ data: res }) => {
        const list = res.success ? res.data : Array.isArray(res) ? res : [];
        setUsers(list);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async () => {
    setMsg(null);
    try {
      await usersApi.create(form);
      setMsg({ type: 'success', text: 'User created' });
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', is_admin: false });
      fetchUsers();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to create user' });
    }
  };

  const toggleAdmin = async (user) => {
    try {
      await usersApi.update(user.id, { is_admin: !user.is_admin });
      setMsg({ type: 'success', text: `${user.name} updated` });
      fetchUsers();
    } catch {
      setMsg({ type: 'error', text: 'Failed to update user' });
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.name}"?`)) return;
    try {
      await usersApi.delete(user.id);
      setMsg({ type: 'success', text: 'User deleted' });
      fetchUsers();
    } catch {
      setMsg({ type: 'error', text: 'Failed to delete user' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Users ({users.length})
        </h3>
        <button
          onClick={() => { setShowCreate(!showCreate); setMsg(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-forge-900 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-lg text-sm ${
            msg.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forge-500"
            />
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forge-500"
            />
            <input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forge-500"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_admin}
                onChange={(e) => setForm((f) => ({ ...f, is_admin: e.target.checked }))}
                className="rounded border-gray-300 text-amber-500 focus:ring-forge-500"
              />
              Admin access
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-forge-900 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
            >
              <Check size={16} />
              Create User
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-forge-500 py-8 text-center">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="pb-2 font-semibold text-forge-700">Name</th>
                <th className="pb-2 font-semibold text-forge-700">Email</th>
                <th className="pb-2 font-semibold text-forge-700">Role</th>
                <th className="pb-2 font-semibold text-forge-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 font-medium text-forge-700">{user.name}</td>
                  <td className="py-2.5 text-gray-600">{user.email}</td>
                  <td className="py-2.5">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.is_admin
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {user.is_admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => toggleAdmin(user)}
                      className="p-1.5 text-gray-400 hover:text-forge-600 transition-colors"
                      title={user.is_admin ? 'Remove admin' : 'Make admin'}
                    >
                      {user.is_admin ? <Users size={15} /> : <Settings size={15} />}
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-gray-400 py-8 text-center text-sm">
              No users found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ingestion Tab                                                      */
/* ------------------------------------------------------------------ */
function IngestionTab() {
  const [files, setFiles] = useState([]);
  const [corpusMode, setCorpusMode] = useState('existing'); // 'existing' | 'new'
  const [corpusName, setCorpusName] = useState('');
  const [existingCorpus, setExistingCorpus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);
  const [msg, setMsg] = useState(null);
  const [corpora, setCorpora] = useState([]);
  const [selectedCorpus, setSelectedCorpus] = useState('');
  const [corpusStatus, setCorpusStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [loadingCorpora, setLoadingCorpora] = useState(true);

  const resolvedCorpus = corpusMode === 'existing' ? existingCorpus : corpusName.trim();

  const fetchCorpora = useCallback(() => {
    setLoadingCorpora(true);
    chatApi
      .corpora()
      .then(({ data: res }) => {
        const list = res.success ? res.data : Array.isArray(res) ? res : [];
        setCorpora(list);
      })
      .catch(() => setCorpora([]))
      .finally(() => setLoadingCorpora(false));
  }, []);

  useEffect(() => {
    fetchCorpora();
  }, [fetchCorpora]);

  // Fetch status when selected corpus changes
  useEffect(() => {
    if (!selectedCorpus) {
      setCorpusStatus(null);
      return;
    }
    setStatusLoading(true);
    ingestApi
      .status(selectedCorpus)
      .then(({ data: res }) => {
        setCorpusStatus(res.success ? res.data : res);
      })
      .catch(() => setCorpusStatus(null))
      .finally(() => setStatusLoading(false));
  }, [selectedCorpus]);

  const handleUpload = async () => {
    if (files.length === 0 || !resolvedCorpus) {
      setMsg({ type: 'error', text: 'Please select files and specify a corpus.' });
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setUploadResults(null);
    setMsg(null);

    try {
      const { data: res } = await ingestApi.upload(files, resolvedCorpus, (e) => {
        if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      });
      const result = res.success ? res.data : res;
      setUploadResults(result);
      setMsg({
        type: result.failed > 0 ? 'error' : 'success',
        text: `Ingested ${result.succeeded}/${result.total} file(s) into "${result.corpus}".${
          result.failed > 0 ? ` ${result.failed} failed.` : ''
        }`,
      });
      setFiles([]);
      setCorpusName('');
      const fileInput = document.getElementById('ingest-file-input');
      if (fileInput) fileInput.value = '';
      fetchCorpora();
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.error || 'Failed to upload files. Please try again.',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClearCorpus = async () => {
    if (!selectedCorpus) return;
    if (!window.confirm(`Are you sure you want to clear all data in corpus "${selectedCorpus}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await ingestApi.clear(selectedCorpus);
      setMsg({ type: 'success', text: `Corpus "${selectedCorpus}" has been cleared.` });
      setSelectedCorpus('');
      setCorpusStatus(null);
      fetchCorpora();
    } catch {
      setMsg({ type: 'error', text: 'Failed to clear corpus.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Upload Documents
        </h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          {/* File picker */}
          <div>
            <label className="block text-sm font-medium text-forge-700 mb-1.5">
              PDF Files (up to 20)
            </label>
            <input
              id="ingest-file-input"
              type="file"
              accept=".pdf"
              multiple
              onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4
                file:rounded-lg file:border-0 file:text-sm file:font-medium
                file:bg-forge-100 file:text-forge-700 hover:file:bg-forge-200
                file:cursor-pointer file:transition-colors"
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <File size={14} className="text-forge-500 shrink-0" />
                  <span>{f.name}</span>
                  <span className="text-gray-400">({(f.size / 1024).toFixed(1)} KB)</span>
                </div>
              ))}
            </div>
          )}

          {/* Corpus selector */}
          <div>
            <label className="block text-sm font-medium text-forge-700 mb-1.5">Corpus</label>
            <div className="flex items-center gap-4 mb-2">
              <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="corpusMode"
                  checked={corpusMode === 'existing'}
                  onChange={() => setCorpusMode('existing')}
                  className="text-amber-500 focus:ring-forge-500"
                />
                Existing corpus
              </label>
              <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="corpusMode"
                  checked={corpusMode === 'new'}
                  onChange={() => setCorpusMode('new')}
                  className="text-amber-500 focus:ring-forge-500"
                />
                Create new
              </label>
            </div>

            {corpusMode === 'existing' ? (
              <select
                value={existingCorpus}
                onChange={(e) => setExistingCorpus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-forge-500"
              >
                <option value="">Select a corpus...</option>
                {corpora.map((c) => (
                  <option key={c.corpus} value={c.corpus}>
                    {c.corpus} ({c.chunks} chunks)
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={corpusName}
                onChange={(e) => setCorpusName(e.target.value)}
                placeholder='e.g. "weekender", "buffett", "project2025"'
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-forge-500 focus:border-forge-500"
              />
            )}
          </div>

          {/* Progress bar */}
          {uploading && uploadProgress > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0 || !resolvedCorpus}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-forge-900
              rounded-lg text-sm font-medium hover:bg-amber-400
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Ingesting...
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload & Ingest {files.length > 0 ? `(${files.length} file${files.length > 1 ? 's' : ''})` : ''}
              </>
            )}
          </button>

          {/* Per-file results */}
          {uploadResults && uploadResults.results && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-1.5">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">
                Results — {uploadResults.succeeded} succeeded, {uploadResults.failed} failed
              </p>
              {uploadResults.results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {r.success ? (
                    <Check size={14} className="text-green-500 shrink-0" />
                  ) : (
                    <X size={14} className="text-red-500 shrink-0" />
                  )}
                  <span className={r.success ? 'text-gray-700' : 'text-red-600'}>
                    {r.sourceFile}
                  </span>
                  {r.success && (
                    <span className="text-gray-400 text-xs">({r.chunks} chunks)</span>
                  )}
                  {!r.success && r.error && (
                    <span className="text-red-400 text-xs">— {r.error}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status messages */}
      {msg && (
        <div
          className={`p-3 rounded-lg text-sm ${
            msg.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Corpus status section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Corpus Management
        </h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-forge-500" />
              <select
                value={selectedCorpus}
                onChange={(e) => setSelectedCorpus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-forge-500 min-w-[200px]"
              >
                <option value="">Select a corpus...</option>
                {corpora.map((c) => (
                  <option key={c.corpus} value={c.corpus}>
                    {c.corpus} ({c.chunks} chunks)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchCorpora}
              disabled={loadingCorpora}
              className="p-2 text-gray-400 hover:text-forge-600 transition-colors"
              title="Refresh corpora list"
            >
              <RefreshCw size={16} className={loadingCorpora ? 'animate-spin' : ''} />
            </button>
          </div>

          {selectedCorpus && (
            <div className="space-y-3">
              {statusLoading ? (
                <div className="text-forge-500 py-4 text-center text-sm">
                  Loading corpus status...
                </div>
              ) : corpusStatus ? (
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Corpus</p>
                      <p className="text-sm font-semibold text-forge-700">{selectedCorpus}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Chunks</p>
                      <p className="text-sm font-semibold text-forge-700">
                        {corpusStatus.chunks ?? corpusStatus.chunk_count ?? 'N/A'}
                      </p>
                    </div>
                  </div>

                  {corpusStatus.source_files && corpusStatus.source_files.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">
                        Source Files
                      </p>
                      <ul className="space-y-1">
                        {corpusStatus.source_files.map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-sm text-gray-600">
                            <File size={13} className="text-gray-400 shrink-0" />
                            {typeof f === 'string' ? f : f.name || f.filename || JSON.stringify(f)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400 py-4 text-center text-sm">
                  Could not load status for this corpus.
                </div>
              )}

              <button
                onClick={handleClearCorpus}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600
                  border border-red-200 rounded-lg text-sm font-medium
                  hover:bg-red-100 transition-colors"
              >
                <AlertTriangle size={15} />
                Clear Corpus
              </button>
            </div>
          )}

          {corpora.length === 0 && !loadingCorpora && (
            <div className="text-gray-400 py-4 text-center text-sm">
              No corpora found. Upload a document to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin Page                                                         */
/* ------------------------------------------------------------------ */
export default function Admin() {
  const [activeTab, setActiveTab] = useState('content');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Settings size={28} className="text-amber-500" />
        <h1 className="text-2xl font-bold text-forge-700">Admin Dashboard</h1>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'text-amber-600 border-b-2 border-amber-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {activeTab === 'content' && <ContentTab />}
        {activeTab === 'bloomberg' && <BloombergTab />}
        {activeTab === 'reading' && <ReadingTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'ingestion' && <IngestionTab />}
      </div>
    </div>
  );
}
