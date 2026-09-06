import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import boardApi from '../api/boardApi';
import invitationApi from '../api/invitationApi';
import socket from '../socket';
import {
  LayoutDashboard,
  Plus,
  LogOut,
  Users,
  ArrowRight,
  FolderKanban,
  AlertCircle,
  X,
  Pencil,
  Trash2,
  Mail,
  Check,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const Dashboard = () => {
  const [boards, setBoards] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [activeInviteTab, setActiveInviteTab] = useState('received');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invitationMessage, setInvitationMessage] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [editingBoard, setEditingBoard] = useState(null);
  const [editBoardTitle, setEditBoardTitle] = useState('');
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      try {
        const boardsData = await boardApi.getBoards();
        setBoards(boardsData || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load boards.');
      }

      try {
        const invitesData = await invitationApi.getPendingInvitations();
        setInvitations(invitesData || []);
      } catch (err) {
        console.error('Failed to load received invitations:', err);
      }

      try {
        const sentData = await invitationApi.getSentInvitations();
        setSentInvitations(sentData || []);
      } catch (err) {
        console.error('Failed to load sent invitations:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const userId = user?.id || user?._id;
    if (userId) {
      socket.emit('join_user', userId);
    }

    const handleInvitationReceived = (newInvite) => {
      setInvitations((prev) => {
        if (prev.some((inv) => inv._id === newInvite._id)) return prev;
        return [newInvite, ...prev];
      });
      setInvitationMessage(`New invitation received for "${newInvite.boardId?.title || 'a board'}"!`);
      setTimeout(() => setInvitationMessage(''), 4000);
    };

    const handleInvitationUpdated = (updatedInvite) => {
      setSentInvitations((prev) =>
        prev.map((inv) => (inv._id === updatedInvite._id ? updatedInvite : inv))
      );
    };

    const handleInvitationCanceled = ({ invitationId }) => {
      setInvitations((prev) => prev.filter((inv) => inv._id !== invitationId));
    };

    const handleBoardUpdated = (updatedBoard) => {
      setBoards((prev) =>
        prev.map((b) => (b._id === updatedBoard._id ? updatedBoard : b))
      );
    };

    const handleBoardDeleted = ({ boardId }) => {
      setBoards((prev) => prev.filter((b) => b._id !== boardId));
    };

    socket.on('invitation_received', handleInvitationReceived);
    socket.on('invitation_updated', handleInvitationUpdated);
    socket.on('invitation_canceled', handleInvitationCanceled);
    socket.on('board_updated', handleBoardUpdated);
    socket.on('board_deleted', handleBoardDeleted);

    return () => {
      if (userId) {
        socket.emit('leave_user', userId);
      }
      socket.off('invitation_received', handleInvitationReceived);
      socket.off('invitation_updated', handleInvitationUpdated);
      socket.off('invitation_canceled', handleInvitationCanceled);
      socket.off('board_updated', handleBoardUpdated);
      socket.off('board_deleted', handleBoardDeleted);
    };
  }, [user]);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) {
      setCreateError('Please enter a board title.');
      return;
    }

    try {
      setCreating(true);
      setCreateError('');
      const newBoard = await boardApi.createBoard({ title: newBoardTitle.trim() });
      setBoards([newBoard, ...boards]);
      setNewBoardTitle('');
      setIsCreateModalOpen(false);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create board.');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEditModal = (e, board) => {
    e.stopPropagation();
    setEditingBoard(board);
    setEditBoardTitle(board.title);
    setEditError('');
  };

  const handleUpdateBoard = async (e) => {
    e.preventDefault();
    if (!editBoardTitle.trim()) {
      setEditError('Please enter a board title.');
      return;
    }

    try {
      setUpdating(true);
      setEditError('');
      const updated = await boardApi.updateBoard(editingBoard._id, {
        title: editBoardTitle.trim(),
      });
      setBoards((prev) =>
        prev.map((b) => (b._id === editingBoard._id ? updated : b))
      );
      setEditingBoard(null);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update board.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteBoard = async (e, board) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${board.title}"? All tasks inside will be permanently removed.`)) {
      return;
    }

    try {
      await boardApi.deleteBoard(board._id);
      setBoards((prev) => prev.filter((b) => b._id !== board._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete board.');
    }
  };

  const handleRespondInvitation = async (invitationId, action) => {
    try {
      await invitationApi.respondToInvitation(invitationId, action);
      setInvitations((prev) => prev.filter((inv) => inv._id !== invitationId));
      setInvitationMessage(
        action === 'accept'
          ? 'Board invitation accepted! The board is now in your list.'
          : 'Board invitation declined.'
      );
      setTimeout(() => setInvitationMessage(''), 4000);

      if (action === 'accept') {
        const updatedBoards = await boardApi.getBoards();
        setBoards(updatedBoards);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to respond to invitation.');
    }
  };

  const handleCancelSentInvitation = async (invitationId) => {
    try {
      await invitationApi.cancelInvitation(invitationId);
      setSentInvitations((prev) => prev.filter((inv) => inv._id !== invitationId));
      setInvitationMessage('Invitation was canceled.');
      setTimeout(() => setInvitationMessage(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel invitation.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        height: '64px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#2563eb',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <LayoutDashboard size={20} />
          </div>
          <span style={{ fontWeight: '700', fontSize: '1.2rem', color: '#0f172a' }}>CollabBoard</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#0f172a',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
              fontSize: '0.85rem',
            }}>
              {user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>
              {user?.username || 'User'}
            </span>
          </div>

          <button
            onClick={logout}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#64748b',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
          >
            <LogOut size={15} />
            Log Out
          </button>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '36px 32px', boxSizing: 'border-box' }}>
        {invitationMessage && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#15803d',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Check size={18} />
            <span>{invitationMessage}</span>
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 600px', minWidth: '320px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '1.65rem', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>
                  Project Boards
                </h1>
                <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                  Select a board to view and collaborate on Kanban tasks
                </p>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(37, 99, 235, 0.3)',
                }}
              >
                <Plus size={17} />
                Create Board
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontSize: '0.95rem' }}>
                Loading your boards...
              </div>
            ) : boards.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '50px 20px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '2px dashed #cbd5e1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}>
                  <FolderKanban size={28} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>
                  No boards found
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '18px' }}>
                  Get started by creating your first collaborative board!
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
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
                  }}
                >
                  <Plus size={16} />
                  Create Your First Board
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '18px',
              }}>
                {boards.map((board) => (
                  <div
                    key={board._id}
                    onClick={() => navigate(`/board/${board._id}`)}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '145px',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.borderColor = '#93c5fd';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0, wordBreak: 'break-word', flex: 1, paddingRight: '8px' }}>
                          {board.title}
                        </h2>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            onClick={(e) => handleOpenEditModal(e, board)}
                            title="Edit Board Title"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.color = '#2563eb';
                              e.currentTarget.style.backgroundColor = '#eff6ff';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.color = '#64748b';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Pencil size={13} />
                          </button>

                          <button
                            onClick={(e) => handleDeleteBoard(e, board)}
                            title="Delete Board"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.color = '#ef4444';
                              e.currentTarget.style.backgroundColor = '#fef2f2';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.color = '#94a3b8';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '600',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                        }}>
                          {board.owner?.username === user?.username ? 'Owner' : 'Member'}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          by {board.owner?.username || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '10px',
                      borderTop: '1px solid #f1f5f9',
                      fontSize: '0.78rem',
                      color: '#64748b',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={13} />
                        <span>{board.members?.length || 1} Member{board.members?.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563eb', fontWeight: '600' }}>
                        <span>Open</span>
                        <ArrowRight size={13} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside style={{
            width: '360px',
            minWidth: '300px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={18} color="#2563eb" />
                <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Invitations
                </h2>
              </div>

              <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '6px', padding: '2px' }}>
                <button
                  onClick={() => setActiveInviteTab('received')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: activeInviteTab === 'received' ? '#ffffff' : 'transparent',
                    color: activeInviteTab === 'received' ? '#0f172a' : '#64748b',
                    fontWeight: '600',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: activeInviteTab === 'received' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>Received</span>
                  {invitations.length > 0 && (
                    <span style={{
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      padding: '1px 5px',
                      borderRadius: '8px',
                    }}>
                      {invitations.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveInviteTab('sent')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: activeInviteTab === 'sent' ? '#ffffff' : 'transparent',
                    color: activeInviteTab === 'sent' ? '#0f172a' : '#64748b',
                    fontWeight: '600',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: activeInviteTab === 'sent' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>Sent</span>
                  {sentInvitations.length > 0 && (
                    <span style={{
                      backgroundColor: '#e2e8f0',
                      color: '#475569',
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      padding: '1px 5px',
                      borderRadius: '8px',
                    }}>
                      {sentInvitations.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '580px', overflowY: 'auto' }}>
              {activeInviteTab === 'received' ? (
                invitations.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '28px 12px',
                    color: '#64748b',
                    fontSize: '0.82rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px dashed #cbd5e1',
                  }}>
                    <Mail size={22} color="#94a3b8" style={{ marginBottom: '6px' }} />
                    <div>No pending invitations received.</div>
                  </div>
                ) : (
                  invitations.map((inv) => (
                    <div
                      key={inv._id}
                      style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>
                          {inv.boardId?.title || 'Untitled Board'}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                          Invited by <strong style={{ color: '#334155' }}>{inv.inviterId?.username || 'Unknown'}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                        <button
                          onClick={() => handleRespondInvitation(inv._id, 'decline')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '5px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#64748b',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = '#fca5a5';
                            e.currentTarget.style.color = '#dc2626';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.color = '#64748b';
                          }}
                        >
                          <X size={12} />
                          Decline
                        </button>
                        <button
                          onClick={() => handleRespondInvitation(inv._id, 'accept')}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '5px',
                            border: 'none',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Check size={12} />
                          Accept
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                sentInvitations.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '28px 12px',
                    color: '#64748b',
                    fontSize: '0.82rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px dashed #cbd5e1',
                  }}>
                    <Send size={22} color="#94a3b8" style={{ marginBottom: '6px' }} />
                    <div>You haven't sent any invitations yet.</div>
                  </div>
                ) : (
                  sentInvitations.map((inv) => {
                    const isPending = inv.status === 'pending';
                    const isAccepted = inv.status === 'accepted';
                    return (
                      <div
                        key={inv._id}
                        style={{
                          backgroundColor: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>
                              {inv.boardId?.title || 'Board'}
                            </span>
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '0.68rem',
                              fontWeight: '600',
                              padding: '1px 6px',
                              borderRadius: '10px',
                              backgroundColor: isPending ? '#fef3c7' : isAccepted ? '#dcfce7' : '#fee2e2',
                              color: isPending ? '#b45309' : isAccepted ? '#15803d' : '#b91c1c',
                              textTransform: 'capitalize',
                            }}>
                              {isPending && <Clock size={10} />}
                              {isAccepted && <CheckCircle2 size={10} />}
                              {!isPending && !isAccepted && <XCircle size={10} />}
                              {inv.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                            Recipient: <strong style={{ color: '#334155' }}>{inv.recipientId?.username || 'Unknown'}</strong>
                          </div>
                        </div>

                        {isPending && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                            <button
                              onClick={() => handleCancelSentInvitation(inv._id)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '5px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                color: '#64748b',
                                fontSize: '0.72rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.borderColor = '#fca5a5';
                                e.currentTarget.style.color = '#dc2626';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.borderColor = '#cbd5e1';
                                e.currentTarget.style.color = '#64748b';
                              }}
                            >
                              <X size={11} />
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              )}
            </div>
          </aside>
        </div>
      </main>

      {isCreateModalOpen && (
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
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Create New Board
              </h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateError('');
                  setNewBoardTitle('');
                }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
              Enter a name for your project board to begin organizing tasks.
            </p>

            {createError && (
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
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBoard}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Board Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sprint 1 - Frontend Revamp"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
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
                    setIsCreateModalOpen(false);
                    setCreateError('');
                    setNewBoardTitle('');
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
                  disabled={creating}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    opacity: creating ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={16} />
                  {creating ? 'Creating...' : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingBoard && (
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
                  setEditingBoard(null);
                  setEditError('');
                }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
              Update the name of this project board.
            </p>

            {editError && (
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
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateBoard}>
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
                    setEditingBoard(null);
                    setEditError('');
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
                  disabled={updating}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: updating ? 'not-allowed' : 'pointer',
                    opacity: updating ? 0.7 : 1,
                  }}
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
