import React from 'react';

function TaskCard({ task }) {
  const getTagColor = (tag) => {
    switch (tag) {
      case 'Frontend': return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 'Backend': return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };
      case 'Database': return { bg: '#fefce8', text: '#a16207', border: '#fef08a' };
      default: return { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' };
    }
  };

  const tagStyle = getTagColor(task.tag);

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '6px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', cursor: 'grab' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '2px 8px', borderRadius: '4px', backgroundColor: tagStyle.bg, color: tagStyle.text, border: `1px solid ${tagStyle.border}` }}>
          {task.tag}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>
          {task.priority} Priority
        </span>
      </div>

      <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>{task.title}</h3>
      <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4', marginBottom: '14px' }}>{task.description}</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f8fafc' }}>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Due {task.dueDate}</span>
        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: task.assignee === 'Sandev' ? '#2563eb' : '#64748b', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {task.assignee === 'Sandev' ? 'SS' : 'TM'}
        </div>
      </div>
    </div>
  );
}

export default TaskCard;