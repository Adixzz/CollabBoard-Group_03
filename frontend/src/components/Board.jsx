import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Column from './Column';
import taskApi from '../api/taskApi';
import boardApi from '../api/boardApi';
import invitationApi from '../api/invitationApi';
import socket from '../socket';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Users,
  LogOut,
  AlertCircle,
  X,
  User,
  Tag,
  Calendar,
  Pencil,
  Trash2,
  UserPlus,
  Check,
} from 'lucide-react';

function Board() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('All');

  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const [isEditBoardModalOpen, setIsEditBoardModalOpen] = useState(false);
  const [editBoardTitle, setEditBoardTitle] = useState('');
  const [updatingBoard, setUpdatingBoard] = useState(false);
  const [editBoardError, setEditBoardError] = useState('');

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'To-Do',
    tag: 'Frontend',
    priority: 'Medium',
    assignees: [],
    dueDate: '',
  });
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskModalError, setTaskModalError] = useState('');

  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'To-Do',
    tag: 'Frontend',
    priority: 'Medium',
    assignees: [],
    dueDate: '',
  });
  const [updatingTask, setUpdatingTask] = useState(false);
  const [editModalError, setEditModalError] = useState('');

  const loadBoardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [boardData, taskData] = await Promise.all([
        boardApi.getBoardById(boardId),
        taskApi.getTasks(boardId),
      ]);
      setBoard(boardData);
      setTasks(taskData);
      setEditBoardTitle(boardData.title);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load board data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!boardId) return;

    loadBoardData();

    socket.emit('join_board', boardId);

    const handleTaskCreated = (newTask) => {
      const taskBoardId = newTask.boardId?._id || newTask.boardId;
      if (String(taskBoardId) === String(boardId)) {
        setTasks((prev) => {
          if (prev.some((t) => String(t._id || t.id) === String(newTask._id || newTask.id))) {
            return prev;
          }
          return [newTask, ...prev];
        });
      }
    };

    const handleTaskUpdated = (updatedTask) => {
      const taskBoardId = updatedTask.boardId?._id || updatedTask.boardId;
      if (String(taskBoardId) === String(boardId)) {
        setTasks((prev) =>
          prev.map((t) =>
            String(t._id || t.id) === String(updatedTask._id || updatedTask.id) ? updatedTask : t
          )
        );
      }
    };

    const handleTaskDeleted = ({ taskId, boardId: bId }) => {
      if (String(bId) === String(boardId)) {
        setTasks((prev) => prev.filter((t) => String(t._id || t.id) !== String(taskId)));
      }
    };

    const handleBoardUpdated = (updatedBoard) => {
      if (String(updatedBoard._id || updatedBoard.id) === String(boardId)) {
        setBoard(updatedBoard);
        setEditBoardTitle(updatedBoard.title);
      }
    };

    const handleBoardDeleted = ({ boardId: bId }) => {
      if (String(bId) === String(boardId)) {
        alert('This board has been deleted by its owner.');
        navigate('/dashboard');
      }
    };

    const handleMemberJoined = ({ boardId: bId }) => {
      if (String(bId) === String(boardId)) {
        boardApi.getBoardById(boardId).then(setBoard).catch(() => {});
      }
    };

    socket.on('task_created', handleTaskCreated);
    socket.on('task_updated', handleTaskUpdated);
    socket.on('task_deleted', handleTaskDeleted);
    socket.on('board_updated', handleBoardUpdated);
    socket.on('board_deleted', handleBoardDeleted);
    socket.on('member_joined', handleMemberJoined);

    return () => {
      socket.emit('leave_board', boardId);
      socket.off('task_created', handleTaskCreated);
      socket.off('task_updated', handleTaskUpdated);
      socket.off('task_deleted', handleTaskDeleted);
      socket.off('board_updated', handleBoardUpdated);
      socket.off('board_deleted', handleBoardDeleted);
      socket.off('member_joined', handleMemberJoined);
    };
  }, [boardId]);

  const isOwner = board?.owner?._id === user?.id || board?.owner?.username === user?.username;

  const handleUpdateBoardTitle = async (e) => {
    e.preventDefault();
    if (!editBoardTitle.trim()) {
      setEditBoardError('Board title cannot be empty.');
      return;
    }

    try {
      setUpdatingBoard(true);
      setEditBoardError('');
      const updated = await boardApi.updateBoard(boardId, {
        title: editBoardTitle.trim(),
      });
      setBoard(updated);
      setIsEditBoardModalOpen(false);
    } catch (err) {
      setEditBoardError(err.response?.data?.message || 'Failed to update board title.');
    } finally {
      setUpdatingBoard(false);
    }
  };

  const handleDeleteCurrentBoard = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${board?.title}"? All tasks inside this board will be permanently deleted.`
      )
    ) {
      return;
    }

    try {
      await boardApi.deleteBoard(boardId);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete board.');
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteUsername.trim()) {
      setInviteError('Please enter a username to invite.');
      return;
    }

    try {
      setInviting(true);
      setInviteError('');
      const res = await invitationApi.sendInvite({
        boardId,
        username: inviteUsername.trim(),
      });
      setIsInviteModalOpen(false);
      setInviteUsername('');
      setSuccessBanner(res.message || 'Invitation sent successfully!');
      setTimeout(() => setSuccessBanner(''), 4000);
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to send invitation.');
    } finally {
      setInviting(false);
    }
  };

  const toggleCreateAssignee = (memberId) => {
    setTaskForm((prev) => {
      const exists = prev.assignees.includes(memberId);
      return {
        ...prev,
        assignees: exists
          ? prev.assignees.filter((id) => id !== memberId)
          : [...prev.assignees, memberId],
      };
    });
  };

  const toggleEditAssignee = (memberId) => {
    setEditForm((prev) => {
      const exists = prev.assignees.includes(memberId);
      return {
        ...prev,
        assignees: exists
          ? prev.assignees.filter((id) => id !== memberId)
          : [...prev.assignees, memberId],
      };
    });
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      setTaskModalError('Please enter a task title.');
      return;
    }

    try {
      setCreatingTask(true);
      setTaskModalError('');

      const created = await taskApi.createTask({
        ...taskForm,
        boardId,
      });

      setTasks([created, ...tasks]);
      setIsTaskModalOpen(false);
      setTaskForm({
        title: '',
        description: '',
        status: 'To-Do',
        tag: 'Frontend',
        priority: 'Medium',
        assignees: [],
        dueDate: '',
      });
    } catch (err) {
      setTaskModalError(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    const currentAssignees =
      task.assignees && task.assignees.length > 0
        ? task.assignees.map((a) => a._id || a.id || a)
        : task.assigneeId
        ? [task.assigneeId?._id || task.assigneeId]
        : [];

    setEditForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status === 'To Do' ? 'To-Do' : task.status || 'To-Do',
      tag: task.tag || 'Frontend',
      priority: task.priority || 'Medium',
      assignees: currentAssignees,
      dueDate: task.dueDate || '',
    });
    setEditModalError('');
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      setEditModalError('Please enter a task title.');
      return;
    }

    try {
      setUpdatingTask(true);
      setEditModalError('');

      const updated = await taskApi.updateTask(editingTask._id || editingTask.id, {
        ...editForm,
      });

      setTasks((prev) =>
        prev.map((t) => ((t._id || t.id) === (editingTask._id || editingTask.id) ? updated : t))
      );
      setEditingTask(null);
    } catch (err) {
      setEditModalError(err.response?.data?.message || 'Failed to update task.');
    } finally {
      setUpdatingTask(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setTasks((prev) =>
        prev.map((t) => ((t._id || t.id) === taskId ? { ...t, status: newStatus } : t))
      );
      await taskApi.updateTask(taskId, { status: newStatus });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update task status.';
      setError(msg);
      setTimeout(() => setError(''), 4000);
      loadBoardData();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      setTasks((prev) => prev.filter((t) => (t._id || t.id) !== taskId));
      await taskApi.deleteTask(taskId);
    } catch (err) {
      console.error('Failed to delete task:', err);
      loadBoardData();
    }
  };

  const handleDragStart = (e, task) => {
    const id = task._id || task.id;
    setDraggedTaskId(id);
    e.dataTransfer.setData('taskId', id);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  const handleDrop = async (e, targetStatus) => {
    const taskId = e.dataTransfer.getData('taskId') || draggedTaskId;
    if (!taskId) return;

    const normalizedTarget = targetStatus === 'To Do' ? 'To-Do' : targetStatus;
    const task = tasks.find((t) => (t._id || t.id) === taskId);

    if (task && (task.status === 'To Do' ? 'To-Do' : task.status) !== normalizedTarget) {
      handleStatusChange(taskId, normalizedTarget);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = tagFilter === 'All' || task.tag === tagFilter;

    return matchesSearch && matchesTag;
  });

  const todoTasks = filteredTasks.filter(
    (t) => t.status === 'To-Do' || t.status === 'To Do'
  );
  const doingTasks = filteredTasks.filter((t) => t.status === 'Doing');
  const doneTasks = filteredTasks.filter((t) => t.status === 'Done');

  return (
    <div style={{ display: 'flex', width: '100vw', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <aside style={{
        width: '260px',
        minWidth: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#2563eb',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <LayoutDashboard size={18} />
            </div>
            <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#0f172a' }}>CollabBoard</span>
          </div>

          <div style={{ marginTop: '20px' }}>
            <Link
              to="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '6px',
                color: '#64748b',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: '600',
                marginBottom: '16px',
                transition: 'background-color 0.15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <ArrowLeft size={16} />
              <span>Back to Boards</span>
            </Link>

            <div style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: '#eff6ff',
              border: '1px solid #dbeafe',
              color: '#1e40af',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '700', color: '#3b82f6', letterSpacing: '0.05em' }}>
                  Current Board
                </div>
                {isOwner && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      onClick={() => {
                        setEditBoardTitle(board?.title || '');
                        setIsEditBoardModalOpen(true);
                      }}
                      title="Edit Board Title"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dbeafe')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={handleDeleteCurrentBoard}
                      title="Delete Board"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', marginTop: '4px', wordBreak: 'break-word' }}>
                {board ? board.title : 'Loading...'}
              </div>
            </div>

            {board && (
              <div style={{ marginTop: '24px', padding: '0 4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                    <Users size={14} />
                    <span>Members ({board.members?.length || 1})</span>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => {
                        setInviteUsername('');
                        setInviteError('');
                        setIsInviteModalOpen(true);
                      }}
                      title="Invite Member to Board"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <UserPlus size={13} />
                      Invite
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {board.members?.map((m) => {
                    const memberUsername = m.username || 'Member';
                    return (
                      <div key={m._id || m} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#334155' }}>
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: '#e2e8f0',
                          color: '#475569',
                          fontSize: '0.65rem',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {memberUsername.substring(0, 2).toUpperCase()}
                        </div>
                        <span>{memberUsername}</span>
                        {board.owner?._id === m._id && (
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic' }}>(Owner)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 8px',
          borderTop: '1px solid #f1f5f9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: '#0f172a',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '0.8rem',
            }}>
              {user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>
                {user?.username || 'User'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {isOwner ? 'Board Owner' : 'Board Member'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{
          height: '64px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '6px 12px',
              width: '240px',
            }}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '0.85rem',
                  width: '100%',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} color="#64748b" />
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Tag:</span>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                style={{
                  fontSize: '0.85rem',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="All">All Tags</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Database">Database</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setIsTaskModalOpen(true)}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 3px rgba(37, 99, 235, 0.3)',
            }}
          >
            <Plus size={16} />
            Add Task
          </button>
        </header>

        <main style={{ flex: 1, padding: '32px', overflowX: 'auto', backgroundColor: '#f8fafc' }}>
          {successBanner && (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Check size={18} />
              <span>{successBanner}</span>
            </div>
          )}

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              Loading Kanban board...
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(320px, 1fr))',
              gap: '24px',
              alignItems: 'flex-start',
              minWidth: '1000px',
            }}>
              <Column
                title="To Do"
                status="To-Do"
                tasks={todoTasks}
                count={todoTasks.length}
                currentUser={user}
                isOwner={isOwner}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteTask}
                onEdit={handleOpenEditModal}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
              />
              <Column
                title="Doing"
                status="Doing"
                tasks={doingTasks}
                count={doingTasks.length}
                currentUser={user}
                isOwner={isOwner}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteTask}
                onEdit={handleOpenEditModal}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
              />
              <Column
                title="Done"
                status="Done"
                tasks={doneTasks}
                count={doneTasks.length}
                currentUser={user}
                isOwner={isOwner}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteTask}
                onEdit={handleOpenEditModal}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
              />
            </div>
          )}
        </main>
      </div>

      {isInviteModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '460px',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} color="#2563eb" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Invite Member to Board
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteError('');
                  setInviteUsername('');
                }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
              Send an invitation to a registered user to collaborate on <strong>{board?.title}</strong>.
            </p>

            {inviteError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AlertCircle size={16} />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleSendInvite}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  User's Username
                </label>
                <input
                  type="text"
                  placeholder="Enter exact username"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsInviteModalOpen(false);
                    setInviteError('');
                    setInviteUsername('');
                  }}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: inviting ? 'not-allowed' : 'pointer',
                    opacity: inviting ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <UserPlus size={16} />
                  {inviting ? 'Sending Invite...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditBoardModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '460px',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Pencil size={18} color="#2563eb" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Edit Board Title
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsEditBoardModalOpen(false);
                  setEditBoardError('');
                }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
              Update the name of this project board.
            </p>

            {editBoardError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AlertCircle size={16} />
                <span>{editBoardError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateBoardTitle}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Board Title
                </label>
                <input
                  type="text"
                  value={editBoardTitle}
                  onChange={(e) => setEditBoardTitle(e.target.value)}
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditBoardModalOpen(false);
                    setEditBoardError('');
                  }}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingBoard}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: updatingBoard ? 'not-allowed' : 'pointer',
                    opacity: updatingBoard ? 0.7 : 1,
                  }}
                >
                  {updatingBoard ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTaskModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Add New Task
              </h2>
              <button
                onClick={() => {
                  setIsTaskModalOpen(false);
                  setTaskModalError('');
                }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {taskModalError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AlertCircle size={16} />
                <span>{taskModalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Implement OAuth Flow"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  placeholder="Provide task details or acceptance criteria..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  <Users size={13} />
                  Assign Members ({taskForm.assignees.length} selected)
                </label>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  padding: '8px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  backgroundColor: '#f8fafc',
                }}>
                  {board?.members?.map((m) => {
                    const mId = m._id || m;
                    const isSelected = taskForm.assignees.includes(mId);
                    const mName = m.username || 'Member';
                    return (
                      <button
                        key={mId}
                        type="button"
                        onClick={() => toggleCreateAssignee(mId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          border: isSelected ? '1px solid #2563eb' : '1px solid #cbd5e1',
                          backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                          color: isSelected ? '#1d4ed8' : '#475569',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? '#2563eb' : '#94a3b8',
                          color: '#fff',
                          fontSize: '0.55rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {isSelected ? <Check size={11} strokeWidth={3} /> : mName.substring(0, 2).toUpperCase()}
                        </div>
                        <span>{mName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Status
                  </label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      backgroundColor: '#fff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="To-Do">To-Do</option>
                    <option value="Doing">Doing</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    <Tag size={13} />
                    Tag
                  </label>
                  <select
                    value={taskForm.tag}
                    onChange={(e) => setTaskForm({ ...taskForm, tag: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      backgroundColor: '#fff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Database">Database</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      backgroundColor: '#fff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  <Calendar size={13} />
                  Due Date
                </label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTask}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: creatingTask ? 'not-allowed' : 'pointer',
                    opacity: creatingTask ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={16} />
                  {creatingTask ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Pencil size={18} color="#2563eb" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Edit Task
                </h2>
              </div>
              <button
                onClick={() => {
                  setEditingTask(null);
                  setEditModalError('');
                }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {editModalError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AlertCircle size={16} />
                <span>{editModalError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  <Users size={13} />
                  Assign Members ({editForm.assignees.length} selected)
                </label>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  padding: '8px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  backgroundColor: '#f8fafc',
                }}>
                  {board?.members?.map((m) => {
                    const mId = m._id || m;
                    const isSelected = editForm.assignees.includes(mId);
                    const mName = m.username || 'Member';
                    return (
                      <button
                        key={mId}
                        type="button"
                        onClick={() => toggleEditAssignee(mId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          border: isSelected ? '1px solid #2563eb' : '1px solid #cbd5e1',
                          backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                          color: isSelected ? '#1d4ed8' : '#475569',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? '#2563eb' : '#94a3b8',
                          color: '#fff',
                          fontSize: '0.55rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {isSelected ? <Check size={11} strokeWidth={3} /> : mName.substring(0, 2).toUpperCase()}
                        </div>
                        <span>{mName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      backgroundColor: '#fff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="To-Do">To-Do</option>
                    <option value="Doing">Doing</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    <Tag size={13} />
                    Tag
                  </label>
                  <select
                    value={editForm.tag}
                    onChange={(e) => setEditForm({ ...editForm, tag: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      backgroundColor: '#fff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Database">Database</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Priority
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      backgroundColor: '#fff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  <Calendar size={13} />
                  Due Date
                </label>
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingTask}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: updatingTask ? 'not-allowed' : 'pointer',
                    opacity: updatingTask ? 0.7 : 1,
                  }}
                >
                  {updatingTask ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Board;