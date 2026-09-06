import axiosClient from './axiosClient';

export const taskApi = {
  getTasks: async (boardId) => {
    const params = boardId ? { boardId } : {};
    const response = await axiosClient.get('/tasks', { params });
    return response.data;
  },

  createTask: async (taskData) => {
    const response = await axiosClient.post('/tasks', taskData);
    return response.data;
  },

  updateTask: async (taskId, taskData) => {
    const response = await axiosClient.put(`/tasks/${taskId}`, taskData);
    return response.data;
  },

  deleteTask: async (taskId) => {
    const response = await axiosClient.delete(`/tasks/${taskId}`);
    return response.data;
  },
};

export default taskApi;
