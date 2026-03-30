import { useMemo, useState, type ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { PageHeader } from "./components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock3, Users, NotebookText, ArrowLeft, CheckCircle2 } from "lucide-react";

type Tab = "upcoming" | "all" | "schedule";

export function MeetingsView({ projectId }: { projectId: Id<"projects"> | null }) {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [selectedMeetingId, setSelectedMeetingId] = useState<Id<"meetings"> | null>(null);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [topics, setTopics] = useState("");

  const allMeetings = useQuery(api.meetings.list, projectId ? { projectId } : {});
  const upcomingMeetings = useQuery(api.meetings.getUpcoming, projectId ? { projectId } : {});
  const selectedMeeting = useQuery(
    api.meetings.get,
    selectedMeetingId ? { meetingId: selectedMeetingId } : "skip"
  );
  const agents = useQuery(api.agents.listAll, projectId ? { projectId } : {});

  const scheduleMeeting = useMutation(api.meetings.schedule);
  const convertActionItems = useMutation(api.meetings.convertActionItems);

  const meetings = allMeetings ?? [];
  const upcoming = upcomingMeetings ?? [];
  const completedMeetings = meetings.filter((meeting) => meeting.status === "COMPLETED").length;
  const scheduledParticipants = upcoming.reduce((sum, meeting) => sum + meeting.participants.length, 0);
  const averageDuration = meetings.length > 0
    ? Math.round(meetings.reduce((sum, meeting) => sum + meeting.duration, 0) / meetings.length)
    : 0;

  const visibleMeetings = tab === "upcoming" ? upcoming : meetings;

  const selectedActionItems = useMemo(
    () => selectedMeeting?.actionItems ?? [],
    [selectedMeeting]
  );

  const handleSchedule = async () => {
    if (!title.trim()) return;
    const topicList = topics.split("\n").map((topic) => topic.trim()).filter(Boolean);
    await scheduleMeeting({
      projectId: projectId ?? undefined,
      title: title.trim(),
      scheduledAt: Date.now() + 86_400_000,
      duration,
      participants: (agents ?? []).slice(0, 5).map((agent) => ({
        agentId: agent._id,
        orgPosition: agent.role,
        role: "attendee",
      })),
      agendaTopics: topicList.length > 0 ? topicList : undefined,
    });
    setTitle("");
    setTopics("");
    setTab("upcoming");
  };

  const handleConvert = async () => {
    if (!selectedMeetingId) return;
    await convertActionItems({ meetingId: selectedMeetingId });
  };

  if (selectedMeeting) {
    const pendingActionItems = selectedActionItems.filter((item) => !item.taskId).length;

    return (
      <main className="mc-page">
        <PageHeader
          title={selectedMeeting.title}
          description="Review agenda, attendees, and follow-through before leaving the meeting thread."
          eyebrow="Comms"
          icon={<CalendarDays className="h-4.5 w-4.5" strokeWidth={1.7} />}
          status={
            <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
              {selectedMeeting.status}
            </Badge>
          }
          actions={
            <Button size="sm" variant="outline" onClick={() => setSelectedMeetingId(null)}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to meetings
            </Button>
          }
        />
        <div className="mc-page-body mc-page-stack">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-4">
              <div className="mc-kicker">Scheduled</div>
              <div className="mt-2 text-3xl font-semibold text-foreground">
                {new Date(selectedMeeting.scheduledAt).toLocaleDateString()}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Meeting date and handoff checkpoint</div>
            </Card>
            <Card className="p-4">
              <div className="mc-kicker">Duration</div>
              <div className="mt-2 text-3xl font-semibold text-cyan-100">{selectedMeeting.duration}m</div>
              <div className="mt-1 text-xs text-muted-foreground">Reserved operator and agent time</div>
            </Card>
            <Card className="p-4">
              <div className="mc-kicker">Participants</div>
              <div className="mt-2 text-3xl font-semibold text-foreground">{selectedMeeting.participants.length}</div>
              <div className="mt-1 text-xs text-muted-foreground">People or agents expected in the room</div>
            </Card>
            <Card className="p-4">
              <div className="mc-kicker">Action items</div>
              <div className="mt-2 text-3xl font-semibold text-amber-100">{pendingActionItems}</div>
              <div className="mt-1 text-xs text-muted-foreground">Items that still need a task or explicit owner</div>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <Card className="p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-4">
                  <div className="mc-kicker">Session facts</div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <InfoCell label="Host" value={selectedMeeting.hostAgentId ?? "TBD"} />
                    <InfoCell label="Provider" value={selectedMeeting.provider} />
                    <InfoCell
                      label="Scheduled at"
                      value={new Date(selectedMeeting.scheduledAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    />
                    <InfoCell label="Status" value={selectedMeeting.status} />
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-4">
                  <div className="mc-kicker">Participants</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedMeeting.participants.map((participant, index) => (
                      <Badge key={`${participant.agentId}-${index}`} variant="outline" className="border-[var(--panel-line)] text-muted-foreground">
                        {participant.agentId} {participant.orgPosition ? `· ${participant.orgPosition}` : ""}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {selectedMeeting.agenda && (
                <div className="mt-4 rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-4">
                  <div className="mc-kicker">Agenda</div>
                  <pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {selectedMeeting.agenda}
                  </pre>
                </div>
              )}

              <div className="mt-4 rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="mc-kicker">Action register</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">Turn meeting outcomes into tracked execution</div>
                  </div>
                  {selectedActionItems.length > 0 ? (
                    <Button size="sm" variant="neon-cyan" onClick={handleConvert}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Convert to tasks
                    </Button>
                  ) : null}
                </div>

                {selectedActionItems.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-[var(--panel-line)] px-4 py-8 text-center text-sm text-muted-foreground">
                    No action items recorded yet.
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {selectedActionItems.map((item, index) => (
                      <div
                        key={`${item.description}-${index}`}
                        className="rounded-lg border border-[var(--panel-line)] bg-background/30 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm text-foreground">{item.description}</div>
                          {item.taskId ? (
                            <Badge variant="outline" className="border-emerald-300/20 text-emerald-100">Task created</Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-300/20 text-amber-100">Needs routing</Badge>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {item.assigneeAgentId ? `Assigned to ${item.assigneeAgentId}` : "No assignee yet"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <div className="mc-kicker">Operator notes</div>
              <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>Meetings should end with explicit ownership, not just discussion. If an item matters, convert it into a task before the room closes.</p>
                <p>Use this view to check whether the agenda mapped to execution and whether any task still needs a human decision.</p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mc-page">
      <PageHeader
        title="Meetings"
        description="Scheduled conversations, review syncs, and agenda-driven operator sessions."
        eyebrow="Comms"
        icon={<CalendarDays className="h-4.5 w-4.5" strokeWidth={1.7} />}
        status={
          <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
            {upcoming.length} upcoming
          </Badge>
        }
        actions={
          <div className="flex gap-2">
            {(["upcoming", "all", "schedule"] as Tab[]).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={tab === value ? "default" : "outline"}
                className="capitalize"
                onClick={() => setTab(value)}
              >
                {value}
              </Button>
            ))}
          </div>
        }
      />
      <div className="mc-page-body mc-page-stack">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="mc-kicker">Upcoming</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{upcoming.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">Meetings still ahead on the calendar</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">All meetings</div>
            <div className="mt-2 text-3xl font-semibold text-cyan-100">{meetings.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">Recorded sessions across this project</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Participants booked</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{scheduledParticipants}</div>
            <div className="mt-1 text-xs text-muted-foreground">People or agents attached to upcoming sessions</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Average duration</div>
            <div className="mt-2 text-3xl font-semibold text-amber-100">{averageDuration}m</div>
            <div className="mt-1 text-xs text-muted-foreground">{completedMeetings} meetings completed so far</div>
          </Card>
        </div>

        {tab === "schedule" ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <Card className="p-5">
              <div className="mc-kicker">Schedule a meeting</div>
              <div className="mt-1 text-sm font-semibold text-foreground">Create a session with a title, duration, and agenda seeds</div>
              <div className="mt-4 grid gap-4">
                <Field label="Title">
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Weekly operator review"
                    className="w-full rounded-lg border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-3 py-2.5 text-sm text-foreground outline-none"
                  />
                </Field>
                <Field label="Duration">
                  <input
                    type="number"
                    value={duration}
                    onChange={(event) => setDuration(Number(event.target.value))}
                    className="w-36 rounded-lg border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-3 py-2.5 text-sm text-foreground outline-none"
                  />
                </Field>
                <Field label="Agenda topics">
                  <textarea
                    value={topics}
                    onChange={(event) => setTopics(event.target.value)}
                    rows={6}
                    placeholder={"Review blockers\nDecide approvals\nRoute next work"}
                    className="w-full rounded-lg border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-3 py-3 text-sm text-foreground outline-none"
                  />
                </Field>
                <div className="flex items-center gap-3">
                  <Button onClick={handleSchedule} disabled={!title.trim()} variant="neon-cyan">
                    Schedule meeting
                  </Button>
                  <div className="text-xs text-muted-foreground">New meetings default to tomorrow until a dedicated picker is added.</div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="mc-kicker">Scheduling guidance</div>
              <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>Use meetings for decisions, review, and routing. Do not use them as a substitute for well-scoped tasks.</p>
                <p>A good agenda ends in explicit action items that can be converted into tasks immediately after the session.</p>
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <Card className="p-5">
              <div className="mc-kicker">{tab === "upcoming" ? "Upcoming meetings" : "All meetings"}</div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {tab === "upcoming" ? "What the team is about to discuss" : "Past and future conversations in one register"}
              </div>
              {visibleMeetings.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-[var(--panel-line)] px-4 py-10 text-center">
                  <div className="text-sm font-semibold text-foreground">
                    {tab === "upcoming" ? "No upcoming meetings" : "No meetings found"}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Schedule a review session to keep decisions and follow-through explicit.
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {visibleMeetings.map((meeting) => (
                    <button
                      key={meeting._id}
                      type="button"
                      onClick={() => setSelectedMeetingId(meeting._id)}
                      className="w-full rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-4 text-left transition-colors hover:border-[var(--panel-line-strong)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground">{meeting.title}</div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{new Date(meeting.scheduledAt).toLocaleDateString()}</span>
                            <span>·</span>
                            <span>{meeting.duration} min</span>
                            <span>·</span>
                            <span>{meeting.participants.length} participants</span>
                            <span>·</span>
                            <span>{meeting.provider}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
                          {meeting.status}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <div className="mc-kicker">Operator guidance</div>
              <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>Keep recurring syncs short and agenda-driven. If a meeting does not produce decisions or task routing, it is probably noise.</p>
                <p>Use the detail view to convert action items into tasks before the meeting trail goes stale.</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm text-foreground">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}
