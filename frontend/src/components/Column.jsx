import React, { useState } from 'react';
import TaskCard from './TaskCard';
import { ListTodo, Clock, CheckCircle2 } from 'lucide-react';

function Column({
  title,
  status,
  count,
  tasks,
  onStatusChange,
  onDelete,
  onEdit,
  onDragStart,
  onDragEnd,
  onDrop,
  currentUser,
  isOwner = false,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const getColumnIcon = () => {
    switch (title) {
      case 'To Do':
      case 'To-Do':
        return <ListTodo size={16} color="#2563eb" />;
      case 'Doing':
        return <Clock size={16} color="#f59e0b" />;
      case 'Done':
        return <CheckCircle2 size={16} color="#10b981" />;
      default:
        return <ListTodo size={16} color="#64748b" />;
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (onDrop) {
      onDrop(e, status || title);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        backgroundColor: isDragOver ? '#eff6ff' : '#f1f5f9',
        borderRadius: '10px',
        border: isDragOver ? '2px dashed #3b82f6' : '1px solid #e2e8f0',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '440px',
        transition: 'background-color 0.15s, border-color 0.15s',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getColumnIcon()}
          <h2 style={{
            fontSize: '0.85rem',
            fontWeight: '700',
            color: '#334155',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0,
          }}>
            {title}
          </h2>
          <span style={{
            backgroundColor: isDragOver ? '#bfdbfe' : '#e2e8f0',
            color: isDragOver ? '#1e40af' : '#475569',
            fontSize: '0.75rem',
            fontWeight: '700',
            padding: '2px 8px',
            borderRadius: '10px',
            transition: 'background-color 0.15s',
          }}>
            {count !== undefined ? count : tasks.length}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {tasks.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDragOver ? '#2563eb' : '#94a3b8',
            fontSize: '0.82rem',
            border: isDragOver ? '1px dashed #93c5fd' : '1px dashed #cbd5e1',
            borderRadius: '6px',
            minHeight: '120px',
            transition: 'all 0.15s',
          }}>
            {isDragOver ? 'Drop task here' : 'No tasks in this column'}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task._id || task.id}
              task={task}
              currentUser={currentUser}
              isOwner={isOwner}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onEdit={onEdit}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default Column;