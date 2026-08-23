import React from 'react';
import Column from './Column';

function Board({ tasks }) {
  const todoTasks = tasks.filter(t => t.status === 'To Do');
  const doingTasks = tasks.filter(t => t.status === 'Doing');
  const doneTasks = tasks.filter(t => t.status === 'Done');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(320px, 1fr))', gap: '24px', alignItems: 'flex-start', minWidth: '1000px' }}>
      <Column title="To Do" status="To Do" tasks={todoTasks} />
      <Column title="Doing" status="Doing" tasks={doingTasks} />
      <Column title="Done" status="Done" tasks={doneTasks} />
    </div>
  );
}

export default Board;