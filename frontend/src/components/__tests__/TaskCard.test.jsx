import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from '../TaskCard';

describe('TaskCard Component', () => {
  const mockTask = {
    _id: 'task-1',
    title: 'Setup Kanban Tests',
    description: 'Implement frontend unit tests',
    tag: 'Backend',
    priority: 'High',
    status: 'To-Do',
    dueDate: '2026-10-01',
    ownerId: { _id: 'user-sandev', username: 'Sandev' },
    assignees: [{ _id: 'user-kavindu', username: 'Kavindu' }],
  };

  it('should render task title, description, and metadata badges', () => {
    render(
      <TaskCard
        task={mockTask}
        currentUser={{ id: 'user-sandev', username: 'Sandev' }}
      />
    );

    expect(screen.getByText('Setup Kanban Tests')).toBeInTheDocument();
    expect(screen.getByText('Implement frontend unit tests')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Due 2026-10-01')).toBeInTheDocument();
  });

  it('should render edit and delete buttons for task creator', () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <TaskCard
        task={mockTask}
        currentUser={{ id: 'user-sandev', username: 'Sandev' }}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );

    const editBtn = screen.getByTitle('Edit task');
    const deleteBtn = screen.getByTitle('Delete task');

    expect(editBtn).toBeInTheDocument();
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(mockTask);
  });

  it('should hide edit and delete buttons for non-creator member', () => {
    render(
      <TaskCard
        task={mockTask}
        currentUser={{ id: 'user-kavindu', username: 'Kavindu' }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByTitle('Edit task')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Delete task')).not.toBeInTheDocument();
  });

  it('should trigger onStatusChange when status is updated', () => {
    const handleStatusChange = vi.fn();

    render(
      <TaskCard
        task={mockTask}
        currentUser={{ id: 'user-kavindu', username: 'Kavindu' }}
        onStatusChange={handleStatusChange}
      />
    );

    const select = screen.getByTitle('Change status');
    fireEvent.change(select, { target: { value: 'Doing' } });

    expect(handleStatusChange).toHaveBeenCalledWith('task-1', 'Doing');
  });
});
