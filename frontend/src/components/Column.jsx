import React from 'react';
import TaskCard from './TaskCard';

function Column({ title, tasks }) {
  return (
    <div style={{ backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h2>
          <span style={{ backgroundColor: '#e2e8f0', color: '#475569', fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '10px' }}>
            {tasks.length}
          </span>
        </div>
        <button style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>⋯</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

export default Column;