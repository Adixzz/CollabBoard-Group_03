import React, { useState } from 'react';
import { Trash2, Calendar, User, Circle, GripVertical, Pencil, Lock, Users } from 'lucide-react';

function TaskCard({
  task,
  onStatusChange,
  onDelete,
  onEdit,
  onDragStart,
  onDragEnd,
  currentUser,
  isOwner = false,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const getTagColor = (tag) => {
    switch (tag) {
      case 'Frontend':
        return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 'Backend':
        return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };
      case 'Database':
        return { bg: '#fefce8', text: '#a16207', border: '#fef08a' };
      default:
        return { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return '#ef4444';
      case 'Medium':
        return '#f59e0b';
      case 'Low':
        return '#10b981';
      default:
        return '#64748b';
    }
  };

  const tagStyle = getTagColor(task.tag);

  const assigneesList =
    task.assignees && task.assignees.length > 0
      ? task.assignees
      : task.assigneeId
      ? [task.assigneeId]
      : [];

  const currentUserId = currentUser?.id || currentUser?._id;
  const currentUsername = currentUser?.username;

  const isUserAssigned = assigneesList.some((a) => {
    const aId = a._id || a.id || a;
    return aId === currentUserId || (a.username && a.username === currentUsername);
  });

  const isTaskOwner = (task.ownerId?._id || task.ownerId) === currentUserId;
  const isTaskCreator = isTaskOwner || isOwner;
  const canUpdateStatus = isUserAssigned || isOwner || isTaskOwner;

  const getInitials = (name) => {
    if (!name || name === 'Unassigned') return null;
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div
      draggable={canUpdateStatus}
      onDragStart={(e) => {
        if (!canUpdateStatus) {
          e.preventDefault();
          return;
        }
        setIsDragging(true);
        if (onDragStart) onDragStart(e, task);
      }}
      onDragEnd={(e) => {
        setIsDragging(false);
        if (onDragEnd) onDragEnd(e, task);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: isHovered
          ? '0 4px 8px -2px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)'
          : '0 1px 3px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        cursor: canUpdateStatus ? 'grab' : 'default',
        opacity: isDragging ? 0.4 : 1,
        transform: isDragging ? 'scale(0.98)' : 'none',
        transition: 'box-shadow 0.15s, opacity 0.15s, border-color 0.15s, transform 0.15s',
        borderColor: isHovered ? '#93c5fd' : '#e2e8f0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            title={canUpdateStatus ? 'Drag to move task' : 'Only assigned members can move this task'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: canUpdateStatus
                ? isHovered
                  ? '#2563eb'
                  : '#94a3b8'
                : '#cbd5e1',
              cursor: canUpdateStatus ? 'grab' : 'not-allowed',
              padding: '2px 0',
              transition: 'color 0.15s',
            }}
          >
            {canUpdateStatus ? <GripVertical size={16} /> : <Lock size={13} />}
          </div>

          <span style={{
            fontSize: '0.7rem',
            fontWeight: '600',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: tagStyle.bg,
            color: tagStyle.text,
            border: `1px solid ${tagStyle.border}`,
          }}>
            {task.tag || 'General'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '0.72rem',
            color: getPriorityColor(task.priority),
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginRight: '2px',
          }}>
            <Circle size={7} fill={getPriorityColor(task.priority)} strokeWidth={0} />
            {task.priority || 'Medium'}
          </span>

          {onEdit && isTaskCreator && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              title="Edit task"
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '4px',
                transition: 'color 0.15s, background-color 0.15s',
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
          )}

          {onDelete && isTaskCreator && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task._id || task.id);
              }}
              title="Delete task"
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '4px',
                transition: 'color 0.15s, background-color 0.15s',
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
          )}
        </div>
      </div>

      <h3 style={{ fontSize: '0.92rem', fontWeight: '600', color: '#0f172a', margin: '2px 0 0 0' }}>
        {task.title}
      </h3>

      {task.description && (
        <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4', margin: 0 }}>
          {task.description}
        </p>
      )}

      {onStatusChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Status:</span>
          <select
            value={task.status === 'To Do' ? 'To-Do' : task.status}
            disabled={!canUpdateStatus}
            title={canUpdateStatus ? 'Change status' : 'Only assigned members can change status'}
            onChange={(e) => onStatusChange(task._id || task.id, e.target.value)}
            style={{
              fontSize: '0.72rem',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
              backgroundColor: canUpdateStatus ? '#f8fafc' : '#f1f5f9',
              color: canUpdateStatus ? '#334155' : '#94a3b8',
              cursor: canUpdateStatus ? 'pointer' : 'not-allowed',
              outline: 'none',
            }}
          >
            <option value="To-Do">To-Do</option>
            <option value="Doing">Doing</option>
            <option value="Done">Done</option>
          </select>
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '8px',
        borderTop: '1px solid #f8fafc',
        marginTop: '4px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#94a3b8' }}>
          <Calendar size={13} />
          <span>{task.dueDate ? `Due ${task.dueDate}` : 'No due date'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {assigneesList.length === 0 ? (
            <div
              title="Unassigned"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#e2e8f0',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={12} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {assigneesList.slice(0, 3).map((assignee, index) => {
                const name = assignee?.username || assignee?.name || (typeof assignee === 'string' ? assignee : 'Member');
                const initials = getInitials(name) || 'U';
                return (
                  <div
                    key={assignee._id || assignee.id || index}
                    title={`Assigned to: ${name}`}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: index === 0 ? '#2563eb' : index === 1 ? '#7c3aed' : '#0891b2',
                      color: '#ffffff',
                      fontSize: '0.62rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #ffffff',
                      marginLeft: index > 0 ? '-6px' : '0',
                      zIndex: 3 - index,
                    }}
                  >
                    {initials}
                  </div>
                );
              })}

              {assigneesList.length > 3 && (
                <div
                  title={`+${assigneesList.length - 3} more assignees`}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#64748b',
                    color: '#ffffff',
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #ffffff',
                    marginLeft: '-6px',
                  }}
                >
                  +{assigneesList.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskCard;