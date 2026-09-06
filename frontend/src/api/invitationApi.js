import axiosClient from './axiosClient';

export const invitationApi = {
  sendInvite: async ({ boardId, username }) => {
    const response = await axiosClient.post('/invitations', { boardId, username });
    return response.data;
  },

  getPendingInvitations: async () => {
    const response = await axiosClient.get('/invitations/pending');
    return response.data;
  },

  getSentInvitations: async () => {
    const response = await axiosClient.get('/invitations/sent');
    return response.data;
  },

  respondToInvitation: async (invitationId, action) => {
    const response = await axiosClient.put(`/invitations/${invitationId}/respond`, { action });
    return response.data;
  },

  cancelInvitation: async (invitationId) => {
    const response = await axiosClient.delete(`/invitations/${invitationId}`);
    return response.data;
  },
};

export default invitationApi;
