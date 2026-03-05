import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Clock, DollarSign, Video, MessageSquare, MapPin, ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const OPPORTUNITIES = [
  {
    id: "1",
    title: "STEM Tutor — Calculus",
    client: "Major U.S. tutoring platform",
    subject: "Mathematics",
    payRate: "$20-25/hour",
    modality: "Video",
    schedule: "Weekday evenings EST",
    hoursPerWeek: "10-15",
    requirements: "STEM Teaching Specialist certification preferred, 2+ years calculus tutoring experience",
    description: "We're looking for experienced calculus tutors to join a major U.S. tutoring platform. You'll work with college students on Calculus I and II topics including limits, derivatives, integrals, and applications.",
    status: "open",
  },
  {
    id: "2",
    title: "English Conversation Tutor — Adults",
    client: "Online language school",
    subject: "English",
    payRate: "$18-22/hour",
    modality: "Video",
    schedule: "Flexible, mornings and evenings EST",
    hoursPerWeek: "5-20",
    requirements: "English Conversation Specialist certification preferred, C1+ English level",
    description: "Seeking skilled conversation tutors for adult ESL students. Sessions focus on professional English, business communication, and conversational fluency.",
    status: "open",
  },
  {
    id: "3",
    title: "Writing Tutor — College Essays",
    client: "U.S. academic support service",
    subject: "Writing",
    payRate: "$22-28/hour",
    modality: "Chat",
    schedule: "Weekday afternoons EST",
    hoursPerWeek: "8-12",
    requirements: "Writing Tutor Specialist certification, experience with academic writing",
    description: "Help college students with essay writing, thesis development, and academic formatting. Strong grammar and writing skills in English required.",
    status: "open",
  },
];

export default function OpportunitiesPage() {
  const [modalityFilter, setModalityFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = OPPORTUNITIES.filter((o) => {
    if (modalityFilter !== "all" && o.modality !== modalityFilter) return false;
    return o.status === "open";
  });

  const selectedOpp = OPPORTUNITIES.find((o) => o.id === selected);

  if (selectedOpp) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
          ← Back to Opportunities
        </Button>
        <div className="rounded-xl border bg-card p-6 md:p-8 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Open</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{selectedOpp.title}</h1>
          <p className="text-sm text-muted-foreground mb-6">{selectedOpp.client}</p>

          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" /> {selectedOpp.payRate}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {selectedOpp.modality === "Video" ? <Video className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />} {selectedOpp.modality}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> {selectedOpp.hoursPerWeek} hrs/week
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {selectedOpp.schedule}
            </div>
          </div>

          <h3 className="font-semibold text-foreground mb-2">Description</h3>
          <p className="text-sm text-muted-foreground mb-4">{selectedOpp.description}</p>

          <h3 className="font-semibold text-foreground mb-2">Qualifications</h3>
          <p className="text-sm text-muted-foreground mb-6">{selectedOpp.requirements}</p>

          <Button variant="success" size="lg">
            <CheckCircle className="mr-2 h-4 w-4" /> Express Interest
          </Button>
          <p className="text-xs text-muted-foreground mt-2">Your interest will be recorded. The LatinHire team will review your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tutoring Opportunities</h1>
        <p className="text-sm text-muted-foreground mt-1">Discover available tutoring engagements within the LatinHire network</p>
      </div>

      <div className="flex gap-3">
        <Select value={modalityFilter} onValueChange={setModalityFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Modality" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modalities</SelectItem>
            <SelectItem value="Video">Video</SelectItem>
            <SelectItem value="Chat">Chat</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filtered.map((opp) => (
          <div key={opp.id} className="rounded-xl border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => setSelected(opp.id)}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{opp.title}</h3>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Open</span>
                </div>
                <p className="text-sm text-muted-foreground">{opp.client}</p>
              </div>
              <span className="font-semibold text-primary text-sm">{opp.payRate}</span>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">{opp.modality === "Video" ? <Video className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />} {opp.modality}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {opp.hoursPerWeek} hrs/week</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {opp.schedule}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
