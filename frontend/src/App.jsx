import React from 'react';
import Board from './components/Board';

const mockTasks = [
  {
    id: 1,
    title: 'Create a GitHub repository & initialize React project',
    description: 'Set up a new repository and initialize a React project with Vite.',
    status: 'Done',
    tag: 'Frontend',
    priority: 'High',
    dueDate: 'Aug 2',
    assignee: 'Sandev'
  },
  {
    id: 2,
    title: 'Create Backend for Board, Column, and TaskCard components',
    description: 'Implement RESTful APIs for managing boards, columns, and tasks using Express.js.',
    status: 'Doing',
    tag: 'Backend',
    priority: 'High',
    dueDate: 'Aug 16',
    assignee: 'Team'
  },
  {
    id: 3,
    title: 'Design MongoDB schemas & caching',
    description: 'Structure Mongoose models and implement client-side local caching.',
    status: 'To Do',
    tag: 'Database',
    priority: 'Medium',
    dueDate: 'Aug 23',
    assignee: 'Sandev'
  },
  {
    id: 4,
    title: 'Configure GitHub Actions CI test suite',
    description: 'Automate Jest and Supertest test runs across PRs.',
    status: 'To Do',
    tag: 'DevOps',
    priority: 'Low',
    dueDate: 'Aug 30',
    assignee: 'Team'
  }
];

function App() {
  return (
    <div style={{ display: 'flex', width: '100vw', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {}
      <aside style={{ width: '240px', minWidth: '240px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px 16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#0f172a' }}>CollabBoard</span>
          </div>

          <nav style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>Active Board</div>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 8px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>U</div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>User</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>User Role</div>
          </div>
        </div>
      </aside>

      {}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {}
        <header style={{ height: '64px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <input 
              type="text" 
              placeholder="Search tasks..." 
              style={{ width: '260px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
            />
            <span style={{ fontSize: '0.85rem', color: '#64748b', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '6px' }}>Filter: All</span>
          </div>
          <button style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>
            + Add Task
          </button>
        </header>

        {}
        <main style={{ flex: 1, padding: '32px', overflowX: 'auto', backgroundColor: '#f8fafc' }}>
          <Board tasks={mockTasks} />
        </main>
      </div>
    </div>
  );
}

export default App;