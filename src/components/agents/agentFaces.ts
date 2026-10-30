/** Video portraits for the label's AI agents, keyed by name. `focus` is where the face sits in the frame. */
export interface AgentFaceInfo { video: string; poster: string; focus: string }

const face = (slug: string, focus: string): AgentFaceInfo => ({
  video: `/agents/${slug}.mp4`, poster: `/agents/${slug}.jpg`, focus,
});

export const AGENT_FACES: Record<string, AgentFaceInfo> = {
  "maya rodriguez": face("maya-rodriguez", "53% 32%"),
  "jordan chen": face("jordan-chen", "78% 22%"),
  "victoria sterling": face("victoria-sterling", "58% 38%"),
  "marcus chen-williams": face("marcus-chen-williams", "16% 28%"),
  "kai nakamura": face("kai-nakamura", "50% 16%"),
  "sam rivera": face("sam-rivera", "62% 42%"),
};

export function agentFace(name: string): AgentFaceInfo | null {
  const key = name.toLowerCase().replace(/^dr\.?\s+/, "").trim();
  return AGENT_FACES[key] ?? null;
}
