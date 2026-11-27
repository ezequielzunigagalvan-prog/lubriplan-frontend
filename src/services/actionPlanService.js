// src/services/actionPlanService.js
import { httpGet, httpPost, httpPatch, httpDelete, httpForm } from "./http";

export const getActionPlan = ({ scope = "mine", includeClosed = false, ownerUserId } = {}) => {
  const qs = new URLSearchParams({ scope });
  if (includeClosed) qs.set("includeClosed", "1");
  if (ownerUserId) qs.set("ownerUserId", String(ownerUserId));
  return httpGet(`/action-plan?${qs}`);
};
export const getActionAssignees = () => httpGet("/action-plan/assignees");
export const getMyActionSummary = () => httpGet("/action-plan/my-summary");
export const getActionItem = (id) => httpGet(`/action-plan/${id}`);
export const createActionItem = (data) => httpPost("/action-plan", data);
export const updateActionItem = (id, data) => httpPatch(`/action-plan/${id}`, data);
export const deleteActionItem = (id) => httpDelete(`/action-plan/${id}`);
export const addActionProgress = (id, progress, comment) => httpPost(`/action-plan/${id}/progress`, { progress, comment });
export const addActionComment = (id, text) => httpPost(`/action-plan/${id}/comments`, { text });
export const uploadActionEvidence = (id, file, note = "") => {
  const fd = new FormData();
  fd.append("file", file);
  if (note) fd.append("note", note);
  return httpForm(`/action-plan/${id}/evidence`, fd);
};
export const deleteActionEvidence = (id, evidenceId) => httpDelete(`/action-plan/${id}/evidence/${evidenceId}`);
