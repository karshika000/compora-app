import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  Filter,
  MapPin,
  Clock,
  CheckCircle2,
  Sparkles,
  Building,
  Tag,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { Student, CollegeEvent, EventParticipation } from '../types';

interface StudentParticipationViewProps {
  student: Student;
  events: CollegeEvent[];
  participations: EventParticipation[];
  onNavigateTab: (tab: any) => void;
}

export const StudentParticipationView: React.FC<StudentParticipationViewProps> = ({
  student,
  events = [],
  participations = [],
  onNavigateTab = () => {},
}) => {
  const safeEvents = events || [];
  const safeParticipations = participations || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Filter participations for this student
  const studentParts = useMemo(() => {
    return safeParticipations.filter(
      (p) => p.student_id.toLowerCase() === (student?.student_id || '').toLowerCase()
    );
  }, [safeParticipations, student]);

  // Combined items
  const records = useMemo(() => {
    return studentParts.map((p) => {
      const evt = safeEvents.find((e) => e.id === p.event_id);
      return {
        part: p,
        event: evt,
      };
    }).filter((item) => item.event !== undefined);
  }, [studentParts, safeEvents]);

  const filteredRecords = useMemo(() => {
    return records.filter(({ event, part }) => {
      if (!event) return false;
      const matchesSearch =
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = categoryFilter === 'ALL' || event.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [records, searchTerm, categoryFilter]);

  const upcomingCount = records.filter((r) => r.event?.status === 'Upcoming').length;
  const completedCount = records.filter((r) => r.event?.status === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight">
              My Event Participations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {student.name} • {student.student_id}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official record of all institutional competitions, technical symposiums, and sports meets you have registered for.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('events')}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition shrink-0 cursor-pointer"
        >
          Browse All Events
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Enrolled</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-display mt-0.5">
            {records.length}
          </div>
          <span className="text-[10px] text-slate-400">Events in student transcript</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Upcoming Events</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-display mt-0.5">
            {upcomingCount}
          </div>
          <span className="text-[10px] text-slate-400">Awaiting event date</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Completed Meets</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display mt-0.5">
            {completedCount}
          </div>
          <span className="text-[10px] text-slate-400">Attended & certified</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search your registered events..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
        >
          <option value="ALL">All Categories</option>
          <option value="Technical">Technical</option>
          <option value="Cultural">Cultural</option>
          <option value="Sports">Sports</option>
          <option value="Hackathon">Hackathon</option>
          <option value="Workshop">Workshop</option>
        </select>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecords.length === 0 ? (
          <div className="col-span-2 bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800">
            <Calendar className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              No Participations Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              You are not registered for any events matching your filter criteria.
            </p>
          </div>
        ) : (
          filteredRecords.map(({ part, event }) => {
            if (!event) return null;
            return (
              <div
                key={part.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 hover:border-indigo-300 dark:hover:border-indigo-800 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {event.category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {event.department}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {event.name}
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      event.status === 'Upcoming'
                        ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200'
                        : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {event.description}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {event.venue}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Role: {part.role || 'Participant'}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
