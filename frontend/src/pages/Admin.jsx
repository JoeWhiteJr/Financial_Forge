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
} from 'lucide-react';
import { pagesApi, bloombergApi, booksApi, usersApi } from '../services/api';
import MarkdownEditor from '../components/editor/MarkdownEditor';

const tabs = [
  { key: 'content', label: 'Content', icon: FileText },
  { key: 'bloomberg', label: 'Bloomberg', icon: Monitor },
  { key: 'reading', label: 'Reading List', icon: BookOpen },
  { key: 'users', label: 'Users', icon: Users },
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
      </div>
    </div>
  );
}
