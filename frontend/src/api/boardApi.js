import axiosClient from './axiosClient';

export const boardApi = {
  getBoards: async () => {
    const response = await axiosClient.get('/boards');
    return response.data;
  },

  getBoardById: async (boardId) => {
    const response = await axiosClient.get(`/boards/${boardId}`);
    return response.data;
  },

  createBoard: async (boardData) => {
    const response = await axiosClient.post('/boards', boardData);
    return response.data;
  },

  updateBoard: async (boardId, boardData) => {
    const response = await axiosClient.put(`/boards/${boardId}`, boardData);
    return response.data;
  },

  deleteBoard: async (boardId) => {
    const response = await axiosClient.delete(`/boards/${boardId}`);
    return response.data;
  },
};

export default boardApi;
