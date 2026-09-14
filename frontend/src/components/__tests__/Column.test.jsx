import React from 'react';
import { render, screen } from '@testing-library/react';
import Column from '../Column';

describe('Column Component', () => {
  const mockTasks = [
    {
      _id: 'task-1',
      title: 'Database Schema Setup',
      tag: 'Database',
      priority: 'High',
      status: 'To-Do',
      ownerId: { _id: 'u1', username: 'Sandev' },
      assignees: [],
    },
    {
      _id: 'task-2',
      title: 'React Kanban UI',
      tag: 'Frontend',
      priority: 'Medium',
      status: 'To-Do',
      ownerId: { _id: 'u1', username: 'Sandev' },
      assignees: [],
    },
  ];

  it('should render column title and task count', () => {
    render(
      <Column
        title="To Do"
        status="To-Do"
        count={2}
        tasks={mockTasks}
        currentUser={{ id: 'u1', username: 'Sandev' }}
      />
    );

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Database Schema Setup')).toBeInTheDocument();
    expect(screen.getByText('React Kanban UI')).toBeInTheDocument();
  });

  it('should render empty state when no tasks are present', () => {
    render(
      <Column
        title="Done"
        status="Done"
        count={0}
        tasks={[]}
        currentUser={{ id: 'u1', username: 'Sandev' }}
      />
    );

    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('No tasks in this column')).toBeInTheDocument();
  });
});
