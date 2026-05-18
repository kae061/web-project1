import { fetchAPI } from '../utils/api';
import { Group, Topic, SuperGroup, Message, User } from '../types';

export const groupService = {
  // ── Groups ──────────────────────────────────────────────────────────────────

  createGroup: async (name: string, description: string, memberIds: string[]): Promise<Group> => {
    const res = await fetchAPI('/groups', 'POST', { name, description, memberIds });
    return res.data;
  },

  getGroups: async (): Promise<Group[]> => {
    const res = await fetchAPI('/groups');
    return res.data;
  },

  getGroup: async (groupId: string): Promise<Group> => {
    const res = await fetchAPI(`/groups/${groupId}`);
    return res.data;
  },

  getGroupMessages: async (groupId: string): Promise<Message[]> => {
    const res = await fetchAPI(`/groups/${groupId}/messages`);
    return res.data;
  },

  sendGroupMessage: async (groupId: string, content: string, mediaAttachments?: any[]): Promise<Message> => {
    const res = await fetchAPI(`/groups/${groupId}/messages`, 'POST', { content, mediaAttachments });
    return res.data;
  },

  addMember: async (groupId: string, userId: string): Promise<Group> => {
    const res = await fetchAPI(`/groups/${groupId}/members`, 'POST', { userId });
    return res.data;
  },

  removeMember: async (groupId: string, userId: string): Promise<void> => {
    await fetchAPI(`/groups/${groupId}/members/${userId}`, 'DELETE');
  },

  // ── SuperGroups ─────────────────────────────────────────────────────────────

  createSuperGroup: async (data: {
    name: string;
    description?: string;
    isPublic?: boolean;
    username?: string;
    memberIds?: string[];
  }): Promise<{ superGroup: SuperGroup; defaultTopic: Topic }> => {
    const res = await fetchAPI('/supergroups', 'POST', data);
    return res.data;
  },

  getSuperGroups: async (): Promise<SuperGroup[]> => {
    const res = await fetchAPI('/supergroups');
    return res.data;
  },

  getSuperGroup: async (sgId: string): Promise<SuperGroup> => {
    const res = await fetchAPI(`/supergroups/${sgId}`);
    return res.data;
  },

  getTopics: async (sgId: string): Promise<Topic[]> => {
    const res = await fetchAPI(`/supergroups/${sgId}/topics`);
    return res.data;
  },

  createTopic: async (sgId: string, name: string, description?: string, icon?: string): Promise<Topic> => {
    const res = await fetchAPI(`/supergroups/${sgId}/topics`, 'POST', { name, description, icon });
    return res.data;
  },

  getTopicMessages: async (sgId: string, topicId: string): Promise<Message[]> => {
    const res = await fetchAPI(`/supergroups/${sgId}/topics/${topicId}/messages`);
    return res.data;
  },

  sendTopicMessage: async (sgId: string, topicId: string, content: string, mediaAttachments?: any[]): Promise<Message> => {
    const res = await fetchAPI(`/supergroups/${sgId}/topics/${topicId}/messages`, 'POST', { content, mediaAttachments });
    return res.data;
  },

  addSuperGroupMember: async (sgId: string, userId: string): Promise<void> => {
    await fetchAPI(`/supergroups/${sgId}/members`, 'POST', { userId });
  },
};
