import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Table,
  Trophy,
  Users,
  Calendar,
  Award,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  ChevronDown,
  Layers,
  Sparkles,
  Building2,
  GraduationCap,
  Shield,
  Filter,
  X,
  FileDown,
  Check,
  TrendingUp,
  RotateCcw,
  Clock,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Student,
  CollegeEvent,
  Achievement,
  EventParticipation,
  HouseStats,
  DepartmentStats,
  YearStats,
  HouseName,
} from '../types';
import {
  calculateEventHouseBreakdown,
  calculateHouseStats,
  calculateDepartmentStats,
  calculateYearStats,
} from '../utils/stats';
import { HOUSE_THEMES, getHouseTheme } from '../utils/houseTheme';

interface ReportsViewProps {
  students: Student[];
  events: CollegeEvent[];
  achievements: Achievement[];
  participations: EventParticipation[];
  houseStats: HouseStats[];
  deptStats: DepartmentStats[];
  yearStats: YearStats[];
  onAddToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
}

type ReportTab = 'houses' | 'events_matrix' | 'departments' | 'years';
type DatePreset = 'all' | 'academic_year' | 'last_90' | 'last_30' | 'custom';

export const ReportsView: React.FC<ReportsViewProps> = ({
  students = [],
  events = [],
  achievements = [],
  participations = [],
  houseStats = [],
  deptStats = [],
  yearStats = [],
  onAddToast = () => {},
}) => {
  const safeStudents = students || [];
  const safeEvents = events || [];
  const safeAchievements = achievements || [];
  const safeParticipations = participations || [];

  const [activeReportTab, setActiveReportTab] = useState<ReportTab>('houses');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  // Date Range Filter State
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState<boolean>(false);

  // Handle Preset selection
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      setIsCustomPickerOpen(false);
      onAddToast('Timeline filter reset to All-Time ledger.', 'info', 'Filter Updated');
    } else if (preset === 'academic_year') {
      // 2025-2026 Academic Year
      const currentYear = today.getFullYear();
      const start = `${currentYear - 1}-06-01`;
      const end = `${currentYear}-05-31`;
      setStartDate(start);
      setEndDate(end);
      setIsCustomPickerOpen(false);
      onAddToast(`Filtering by Academic Year: ${start} to ${end}`, 'info', 'Timeline Filter');
    } else if (preset === 'last_90') {
      const past90 = new Date(today);
      past90.setDate(today.getDate() - 90);
      const start = formatDate(past90);
      const end = formatDate(today);
      setStartDate(start);
      setEndDate(end);
      setIsCustomPickerOpen(false);
      onAddToast('Filtering by Past 90 Days timeline.', 'info', 'Timeline Filter');
    } else if (preset === 'last_30') {
      const past30 = new Date(today);
      past30.setDate(today.getDate() - 30);
      const start = formatDate(past30);
      const end = formatDate(today);
      setStartDate(start);
      setEndDate(end);
      setIsCustomPickerOpen(false);
      onAddToast('Filtering by Past 30 Days timeline.', 'info', 'Timeline Filter');
    } else if (preset === 'custom') {
      setIsCustomPickerOpen(true);
      if (!startDate) {
        const past60 = new Date(today);
        past60.setDate(today.getDate() - 60);
        setStartDate(formatDate(past60));
      }
      if (!endDate) {
        setEndDate(formatDate(today));
      }
    }
  };

  const handleResetDateFilter = () => {
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setIsCustomPickerOpen(false);
    onAddToast('Timeline filter cleared.', 'info', 'All Data Restored');
  };

  // Filtered Events based on date range
  const filteredEvents = useMemo(() => {
    if (!startDate && !endDate) return safeEvents;
    return safeEvents.filter((ev) => {
      if (!ev.date) return true;
      if (startDate && ev.date < startDate) return false;
      if (endDate && ev.date > endDate) return false;
      return true;
    });
  }, [safeEvents, startDate, endDate]);

  // Filtered Achievements based on date range
  const filteredAchievements = useMemo(() => {
    if (!startDate && !endDate) return safeAchievements;
    return safeAchievements.filter((ach) => {
      if (!ach.date) return true;
      if (startDate && ach.date < startDate) return false;
      if (endDate && ach.date > endDate) return false;
      return true;
    });
  }, [safeAchievements, startDate, endDate]);

  // Filtered Participations (only participations for events that match date range)
  const filteredParticipations = useMemo(() => {
    if (!startDate && !endDate) return safeParticipations;
    const validEventIds = new Set(filteredEvents.map((e) => e.id));
    return safeParticipations.filter((p) => validEventIds.has(p.event_id));
  }, [safeParticipations, filteredEvents, startDate, endDate]);

  // Dynamically recomputed House, Department, and Year stats for the active timeline!
  const currentHouseStats: HouseStats[] = useMemo(() => {
    if (!startDate && !endDate) return houseStats;
    return calculateHouseStats(safeStudents, filteredAchievements, filteredParticipations);
  }, [safeStudents, filteredAchievements, filteredParticipations, houseStats, startDate, endDate]);

  const currentDeptStats: DepartmentStats[] = useMemo(() => {
    if (!startDate && !endDate) return deptStats;
    return calculateDepartmentStats(safeStudents, filteredAchievements, filteredParticipations);
  }, [safeStudents, filteredAchievements, filteredParticipations, deptStats, startDate, endDate]);

  const currentYearStats: YearStats[] = useMemo(() => {
    if (!startDate && !endDate) return yearStats;
    return calculateYearStats(safeStudents, filteredAchievements, filteredParticipations);
  }, [safeStudents, filteredAchievements, filteredParticipations, yearStats, startDate, endDate]);

  const isFilterActive = Boolean(startDate || endDate);

  // Tab Details & Metadata
  const tabInfo: Record<ReportTab, { title: string; subtitle: string; icon: string; filePrefix: string }> = {
    houses: {
      title: 'House Championship Point Audit',
      subtitle: 'Verified point calculations across collegiate houses (40-30-20-10 & participation weighting).',
      icon: '🏆',
      filePrefix: 'compora_house_championship_analytics',
    },
    events_matrix: {
      title: 'Event-by-House Participation Matrix',
      subtitle: 'Cross-tabulated breakdown of student involvement across scheduled collegiate competitions.',
      icon: '🗓️',
      filePrefix: 'compora_event_house_matrix',
    },
    departments: {
      title: 'Department-wise Performance Audit',
      subtitle: 'Activity density, average participation rates, and distinction points across academic disciplines.',
      icon: '🏢',
      filePrefix: 'compora_department_performance',
    },
    years: {
      title: 'Academic Year Cohort Engagement Statistics',
      subtitle: 'Distribution of activities and student achievements from 1st Year to 4th Year cohorts.',
      icon: '🎓',
      filePrefix: 'compora_cohort_engagement',
    },
  };

  // Helper to extract active table's headers and data rows
  const getActiveTableData = () => {
    if (activeReportTab === 'houses') {
      const headers = [
        'Rank',
        'House Name',
        'Enrolled Students',
        'Event Participations',
        'Part. Points',
        'Achievements Won',
        'Ach. Points',
        'Total House Points',
      ];
      const rows = currentHouseStats.map((h) => [
        h.rank === 1 ? '1st (Leader)' : h.rank === 2 ? '2nd' : h.rank === 3 ? '3rd' : '4th',
        `${h.house} House`,
        h.studentCount.toString(),
        h.participationCount.toString(),
        `+${h.participationPoints} pts`,
        h.achievementCount.toString(),
        `+${h.achievementPoints} pts`,
        `${h.totalPoints} pts`,
      ]);
      return { headers, rows, title: tabInfo.houses.title };
    }

    if (activeReportTab === 'events_matrix') {
      const headers = [
        'Event Name',
        'Department',
        'Date',
        'Red House',
        'Blue House',
        'Green House',
        'Yellow House',
        'Total Participants',
      ];
      const rows = filteredEvents.map((ev) => {
        const breakdown = calculateEventHouseBreakdown(ev.id, filteredParticipations, safeStudents);
        const total = breakdown.Red + breakdown.Blue + breakdown.Green + breakdown.Yellow;
        return [
          ev.name,
          ev.department,
          ev.date,
          breakdown.Red.toString(),
          breakdown.Blue.toString(),
          breakdown.Green.toString(),
          breakdown.Yellow.toString(),
          total.toString(),
        ];
      });
      return { headers, rows, title: tabInfo.events_matrix.title };
    }

    if (activeReportTab === 'departments') {
      const headers = [
        'Department',
        'Enrolled Students',
        'Event Participations',
        'Avg Participations/Std',
        'Achievements Won',
        'Achievement Points',
      ];
      const rows = currentDeptStats.map((d) => {
        const avg = d.studentCount > 0 ? (d.participationCount / d.studentCount).toFixed(2) : '0';
        return [
          d.department,
          d.studentCount.toString(),
          d.participationCount.toString(),
          avg,
          d.achievementCount.toString(),
          `${d.achievementPoints} pts`,
        ];
      });
      return { headers, rows, title: tabInfo.departments.title };
    }

    // 'years'
    const headers = [
      'Academic Year',
      'Enrolled Students',
      'Event Participations',
      'Achievements Won',
      'Status',
    ];
    const rows = currentYearStats.map((y) => [
      y.year,
      y.studentCount.toString(),
      `${y.participationCount} entries`,
      `${y.achievementCount} wins`,
      'Active Cohort',
    ]);
    return { headers, rows, title: tabInfo.years.title };
  };

  // Helper to trigger file download
  const downloadBlobFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. Client-side CSV Converter for Active Table State
  const handleDownloadCSV = () => {
    try {
      setIsGenerating('csv');
      const { headers, rows } = getActiveTableData();
      const timestamp = new Date().toISOString().split('T')[0];
      const prefix = tabInfo[activeReportTab].filePrefix;

      const dateMeta = isFilterActive ? `Timeline: ${startDate || 'Earliest'} to ${endDate || 'Latest'}` : 'Timeline: All-Time Record';

      const csvRows = [
        `"COMPORA - ${tabInfo[activeReportTab].title}"`,
        `"${dateMeta}"`,
        `"Generated On: ${new Date().toLocaleString()}"`,
        '',
        headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ];

      const csvContent = '\uFEFF' + csvRows.join('\r\n');
      downloadBlobFile(csvContent, `${prefix}_${timestamp}.csv`, 'text/csv;charset=utf-8;');
      onAddToast(`Exported "${tabInfo[activeReportTab].title}" to CSV successfully.`, 'success', 'CSV Download Complete');
      setIsDownloadModalOpen(false);
      setIsExportDropdownOpen(false);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      onAddToast('Failed to convert table data to CSV file.', 'error', 'Export Failed');
    } finally {
      setIsGenerating(null);
    }
  };

  // 2. Client-side PDF Converter (jsPDF + autoTable) with visual chart & metrics
  const handleDownloadPDF = () => {
    try {
      setIsGenerating('pdf');
      const { headers, rows, title } = getActiveTableData();
      const timestamp = new Date().toISOString().split('T')[0];
      const prefix = tabInfo[activeReportTab].filePrefix;
      const timelineText = isFilterActive
        ? `Timeline: ${startDate || 'Earliest'} to ${endDate || 'Latest'}`
        : 'Timeline: All-Time Collegiate Ledger';

      const isWide = activeReportTab === 'events_matrix' || activeReportTab === 'houses';
      const doc = new jsPDF({
        orientation: isWide ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      // Top Institutional Header
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.rect(0, 0, pageWidth, 24, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('COMPORA • COLLEGIATE ANALYTICS & AUDIT LEDGER', 14, 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(203, 213, 225);
      doc.text(
        `Official Institutional Report | Generated: ${new Date().toLocaleString()} | ${timelineText}`,
        14,
        18
      );

      // Report Title & Subtitle Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(title, 14, 34);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`${tabInfo[activeReportTab].subtitle} (${timelineText})`, 14, 40);

      // Summary KPI Badge Box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 44, pageWidth - 28, 14, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Total Students: ${safeStudents.length}   |   Events in Range: ${filteredEvents.length}   |   Honors in Range: ${filteredAchievements.length}   |   Championship Leader: ${currentHouseStats[0]?.house || 'Red'} House (${currentHouseStats[0]?.totalPoints || 0} pts)`,
        18,
        53
      );

      let startTableY = 64;

      // Draw Visual Chart representation for the active tab inside the PDF
      if (activeReportTab === 'houses' && currentHouseStats.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(`HOUSE POINTS DISTRIBUTION CHART (${timelineText.toUpperCase()})`, 14, 64);

        const maxPoints = Math.max(...currentHouseStats.map((h) => h.totalPoints), 1);
        const barAreaWidth = pageWidth - 90;
        let chartY = 70;

        const houseColors: Record<string, [number, number, number]> = {
          Red: [239, 68, 68],
          Blue: [14, 165, 233],
          Green: [16, 185, 129],
          Yellow: [245, 158, 11],
        };

        currentHouseStats.forEach((h) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          doc.text(`${h.house} House (${h.rank === 1 ? '1st' : h.rank === 2 ? '2nd' : h.rank === 3 ? '3rd' : '4th'}):`, 14, chartY + 3.5);

          const barWidth = Math.max(5, (h.totalPoints / maxPoints) * barAreaWidth);
          const color = houseColors[h.house] || [79, 70, 229];

          doc.setFillColor(241, 245, 249);
          doc.roundedRect(50, chartY, barAreaWidth, 5, 1, 1, 'F');

          doc.setFillColor(color[0], color[1], color[2]);
          doc.roundedRect(50, chartY, barWidth, 5, 1, 1, 'F');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);
          doc.text(`${h.totalPoints} pts`, 54 + barAreaWidth, chartY + 3.8);

          chartY += 7.5;
        });

        startTableY = chartY + 4;
      }

      // Generate Table using jspdf-autotable
      autoTable(doc, {
        startY: startTableY,
        head: [headers],
        body: rows,
        theme: 'striped',
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          cellPadding: 3,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
          cellPadding: 2.8,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          const str = `Page ${doc.getNumberOfPages()} • COMPORA Official Institutional Record • ${timelineText}`;
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text(str, 14, doc.internal.pageSize.getHeight() - 8);
        },
      });

      doc.save(`${prefix}_${timestamp}.pdf`);
      onAddToast(`Exported "${title}" to PDF document successfully.`, 'success', 'PDF Downloaded');
      setIsDownloadModalOpen(false);
      setIsExportDropdownOpen(false);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      onAddToast('Failed to convert table and chart data to PDF.', 'error', 'Export Failed');
    } finally {
      setIsGenerating(null);
    }
  };

  // 3. Consolidated Multi-Module Master Audit CSV
  const handleDownloadFullAuditCSV = () => {
    try {
      setIsGenerating('full_csv');
      const timestamp = new Date().toISOString().split('T')[0];
      const timelineText = isFilterActive ? `Timeline Filter: ${startDate || 'Earliest'} to ${endDate || 'Latest'}` : 'Timeline: All-Time Record';
      const lines: string[] = [];

      lines.push('===============================================================');
      lines.push('COMPORA - COMPREHENSIVE INSTITUTIONAL AUDIT REPORT');
      lines.push(`Generated On: ${new Date().toLocaleString()}`);
      lines.push(`Timeline Scope: ${timelineText}`);
      lines.push(`Total Enrolled Students: ${safeStudents.length}`);
      lines.push(`Total Events in Range: ${filteredEvents.length}`);
      lines.push(`Total Achievements in Range: ${filteredAchievements.length}`);
      lines.push('===============================================================');
      lines.push('');

      lines.push('--- SECTION 1: HOUSE CHAMPIONSHIP STANDINGS ---');
      lines.push('Rank,House Name,Enrolled Students,Event Participations,Participation Points,Achievements Won,Achievement Points,Total House Points');
      currentHouseStats.forEach((h) => {
        lines.push(`${h.rank},"${h.house} House",${h.studentCount},${h.participationCount},${h.participationPoints},${h.achievementCount},${h.achievementPoints},${h.totalPoints}`);
      });
      lines.push('');

      lines.push('--- SECTION 2: DEPARTMENT PERFORMANCE AUDIT ---');
      lines.push('Department,Enrolled Students,Event Participations,Avg Participations Per Student,Achievements Won,Total Achievement Points');
      currentDeptStats.forEach((d) => {
        const avg = d.studentCount > 0 ? (d.participationCount / d.studentCount).toFixed(2) : '0';
        lines.push(`"${d.department}",${d.studentCount},${d.participationCount},${avg},${d.achievementCount},${d.achievementPoints}`);
      });
      lines.push('');

      lines.push('--- SECTION 3: ACADEMIC YEAR COHORT ENGAGEMENT ---');
      lines.push('Academic Year,Enrolled Students,Event Participations,Achievements Recorded,Status');
      currentYearStats.forEach((y) => {
        lines.push(`"${y.year}",${y.studentCount},${y.participationCount},${y.achievementCount},"Active"`);
      });
      lines.push('');

      lines.push('--- SECTION 4: EVENT PARTICIPATION MATRIX ---');
      lines.push('Event Name,Department,Date,Red House,Blue House,Green House,Yellow House,Total Participants');
      filteredEvents.forEach((ev) => {
        const breakdown = calculateEventHouseBreakdown(ev.id, filteredParticipations, safeStudents);
        const total = breakdown.Red + breakdown.Blue + breakdown.Green + breakdown.Yellow;
        lines.push(`"${ev.name.replace(/"/g, '""')}","${ev.department}",${ev.date},${breakdown.Red},${breakdown.Blue},${breakdown.Green},${breakdown.Yellow},${total}`);
      });

      const fullContent = '\uFEFF' + lines.join('\r\n');
      downloadBlobFile(fullContent, `compora_full_institutional_audit_${timestamp}.csv`, 'text/csv;charset=utf-8;');
      onAddToast('Full consolidated institutional audit report exported to CSV.', 'success', 'Full Audit Downloaded');
      setIsDownloadModalOpen(false);
      setIsExportDropdownOpen(false);
    } catch (err) {
      console.error('Failed to export full audit:', err);
      onAddToast('Failed to export consolidated audit file.', 'error', 'Export Failed');
    } finally {
      setIsGenerating(null);
    }
  };

  // Browser Print option
  const handlePrint = () => {
    setIsDownloadModalOpen(false);
    setIsExportDropdownOpen(false);
    onAddToast('Opening print dialog for current view.', 'info', 'Print Document');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const maxHousePoints = useMemo(() => {
    return Math.max(...currentHouseStats.map((h) => h.totalPoints), 1);
  }, [currentHouseStats]);

  const maxDeptPoints = useMemo(() => {
    return Math.max(...currentDeptStats.map((d) => d.achievementPoints), 1);
  }, [currentDeptStats]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* PRINT-ONLY OFFICIAL HEADER (Rendered only during PDF export / Printing)    */}
      {/* ========================================================================= */}
      <div className="hidden print:block pb-4 mb-4 border-b-2 border-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-lg">
              C
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                COMPORA • COLLEGIATE ANALYTICS
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Official Institutional Management & Activity Audit System
              </p>
            </div>
          </div>
          <div className="text-right text-xs font-mono text-slate-600">
            <div><strong>Report Module:</strong> {tabInfo[activeReportTab].title}</div>
            <div><strong>Date Generated:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
            <div><strong>Timeline Scope:</strong> {isFilterActive ? `${startDate || 'Start'} to ${endDate || 'End'}` : 'All-Time Record'}</div>
          </div>
        </div>

        {/* Quick KPI Bar for PDF */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-200 text-center text-xs">
          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Total Students</div>
            <div className="text-sm font-black text-slate-900">{safeStudents.length}</div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Events in Scope</div>
            <div className="text-sm font-black text-slate-900">{filteredEvents.length}</div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Honors in Scope</div>
            <div className="text-sm font-black text-slate-900">{filteredAchievements.length}</div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Leading House</div>
            <div className="text-sm font-black text-slate-900">{currentHouseStats[0]?.house || 'Red'} ({currentHouseStats[0]?.totalPoints || 0} pts)</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCREEN HEADER & CONTROLS (Hidden during printing)                          */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Institutional Audits & Exports
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
            Institutional Analytics & Official Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics for House Championship standings, Department benchmarks, and Event participation matrices.
          </p>
        </div>

        {/* Action Button Cluster with Download Report */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* PRIMARY: DOWNLOAD REPORT MODAL TRIGGER */}
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-xs hover:shadow transition-all cursor-pointer"
            title="Download currently active table data as CSV or PDF file"
          >
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </button>

          {/* DIRECT PDF BUTTON (jspdf-autotable) */}
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating === 'pdf'}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-xs transition cursor-pointer"
            title="Download formatted PDF document with jspdf-autotable"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isGenerating === 'pdf' ? 'Generating...' : 'PDF'}</span>
          </button>

          {/* DIRECT CSV BUTTON */}
          <button
            onClick={handleDownloadCSV}
            disabled={isGenerating === 'csv'}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs transition cursor-pointer"
            title="Download CSV spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{isGenerating === 'csv' ? 'Converting...' : 'CSV'}</span>
          </button>

          {/* QUICK EXPORT DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isExportDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsExportDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl py-1.5 w-64 z-20 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                    Convert Current State ({tabInfo[activeReportTab].title})
                  </div>
                  
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-rose-500" />
                      <span>Download PDF Document (.pdf)</span>
                    </span>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">PDF</span>
                  </button>

                  <button
                    onClick={handleDownloadCSV}
                    className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Download Spreadsheet (.csv)</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">CSV</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />

                  <button
                    onClick={handleDownloadFullAuditCSV}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    <span>Full Consolidated Audit (All 4 Tabs)</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* PRINT BUTTON */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 shadow-xs transition cursor-pointer"
            title="Open browser print dialog"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DATE RANGE FILTER TOOLBAR                                                 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1.5 mr-2 text-xs font-bold text-slate-600 dark:text-slate-400">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Timeline:</span>
            </div>

            <button
              onClick={() => handlePresetChange('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                datePreset === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Time
            </button>

            <button
              onClick={() => handlePresetChange('academic_year')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                datePreset === 'academic_year'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Academic Year 2025–2026
            </button>

            <button
              onClick={() => handlePresetChange('last_90')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                datePreset === 'last_90'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Past 90 Days
            </button>

            <button
              onClick={() => handlePresetChange('last_30')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                datePreset === 'last_30'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Past 30 Days
            </button>

            <button
              onClick={() => handlePresetChange('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                datePreset === 'custom'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Custom Range</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Active Filter Metrics Pill & Reset */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            {isFilterActive ? (
              <>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    Scope: <strong>{filteredEvents.length}</strong> events, <strong>{filteredAchievements.length}</strong> honors
                  </span>
                </div>
                <button
                  onClick={handleResetDateFilter}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                  title="Clear date range filter"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </>
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                All historical events & verified honors included.
              </span>
            )}
          </div>
        </div>

        {/* Custom Date Pickers Drawer (Expanded when Custom is active) */}
        {(datePreset === 'custom' || isCustomPickerOpen) && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {isFilterActive && (
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Range: {startDate || '—'} → {endDate || '—'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* REPORT NAVIGATION TABS                                                    */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 print:hidden overflow-x-auto">
        <button
          onClick={() => setActiveReportTab('houses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeReportTab === 'houses'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          🏆 House Championship Report
        </button>
        <button
          onClick={() => setActiveReportTab('events_matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeReportTab === 'events_matrix'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          🗓️ Event-House Participation Matrix
        </button>
        <button
          onClick={() => setActiveReportTab('departments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeReportTab === 'departments'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          🏢 Department Analytics
        </button>
        <button
          onClick={() => setActiveReportTab('years')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeReportTab === 'years'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          🎓 Academic Year Cohorts
        </button>
      </div>

      {/* ========================================================================= */}
      {/* REPORT 1: HOUSE CHAMPIONSHIP STANDINGS                                    */}
      {/* ========================================================================= */}
      {activeReportTab === 'houses' && (
        <div className="space-y-6">
          {/* Visual Analytics Chart Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white font-display">
                  House Points Comparison Chart
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Relative standing distribution based on aggregate verified points {isFilterActive ? `(${startDate} to ${endDate})` : '(All Time)'}.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Live Leaderboard
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {currentHouseStats.map((h) => {
                const theme = getHouseTheme(h.house);
                const pct = Math.round((h.totalPoints / maxHousePoints) * 100);
                return (
                  <div
                    key={h.house}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                        <span className={`w-3 h-3 rounded-full ${theme.dotColor}`} />
                        {h.house} House
                      </span>
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                        {h.totalPoints} pts
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          h.house === 'Red'
                            ? 'bg-rose-500'
                            : h.house === 'Blue'
                            ? 'bg-sky-500'
                            : h.house === 'Green'
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.max(8, pct)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{h.participationCount} Participations</span>
                      <span>{h.achievementCount} Honors</span>
                      <span className="font-bold">{h.rank === 1 ? '🥇 Leader' : `#${h.rank} Rank`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full Tabular Audit */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white font-display">
                  Official House Championship Point Audit
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Formula: Achievement Points (College=10, District=20, State=30, National=40) + Participation Points (5 pts per student registration).
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  Leader: {currentHouseStats[0]?.house} House ({currentHouseStats[0]?.totalPoints} pts)
                </span>
                <button
                  onClick={handleDownloadPDF}
                  className="print:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-pointer transition"
                  title="Download PDF"
                >
                  <FileText className="w-3 h-3" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="print:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition"
                  title="Export CSV"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Rank</th>
                    <th className="py-3.5 px-4">House Name</th>
                    <th className="py-3.5 px-4 text-center">Enrolled Students</th>
                    <th className="py-3.5 px-4 text-center">Event Participations</th>
                    <th className="py-3.5 px-4 text-center">Part. Points</th>
                    <th className="py-3.5 px-4 text-center">Achievements Won</th>
                    <th className="py-3.5 px-4 text-center">Ach. Points</th>
                    <th className="py-3.5 px-4 text-right">Total House Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentHouseStats.map((h) => {
                    const theme = getHouseTheme(h.house);
                    return (
                      <tr key={h.house} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                          {h.rank === 1 ? '🥇 1st' : h.rank === 2 ? '🥈 2nd' : h.rank === 3 ? '🥉 3rd' : '4th'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          <span className="inline-flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${theme.dotColor}`} />
                            {h.house} House
                            <span className="text-xs">{theme.emoji}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300 font-medium">
                          {h.studentCount}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300 font-semibold">
                          {h.participationCount}
                        </td>
                        <td className="py-3.5 px-4 text-center text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                          +{h.participationPoints} pts
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300 font-semibold">
                          {h.achievementCount}
                        </td>
                        <td className="py-3.5 px-4 text-center text-amber-700 dark:text-amber-400 font-bold font-mono">
                          +{h.achievementPoints} pts
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-sm text-slate-900 dark:text-white font-mono">
                          {h.totalPoints} pts
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 2: EVENT-HOUSE PARTICIPATION MATRIX                                */}
      {/* ========================================================================= */}
      {activeReportTab === 'events_matrix' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white font-display">
                Cross-Tabulation: Event-by-House Participation Matrix
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed breakdown of how many students from each house registered and participated in each collegiate event {isFilterActive ? `(${startDate} to ${endDate})` : ''}.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleDownloadPDF}
                className="print:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-pointer transition"
                title="Download PDF"
              >
                <FileText className="w-3 h-3" />
                <span>PDF</span>
              </button>
              <button
                onClick={handleDownloadCSV}
                className="print:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition"
                title="Export CSV"
              >
                <Download className="w-3 h-3" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Event Name</th>
                  <th className="py-3.5 px-4">Host Dept</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-center text-rose-600 dark:text-rose-400">🔴 Red House</th>
                  <th className="py-3.5 px-4 text-center text-sky-600 dark:text-sky-400">🔵 Blue House</th>
                  <th className="py-3.5 px-4 text-center text-emerald-600 dark:text-emerald-400">🟢 Green House</th>
                  <th className="py-3.5 px-4 text-center text-amber-600 dark:text-amber-400">🟡 Yellow House</th>
                  <th className="py-3.5 px-4 text-right font-black">Total Participants</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      No events found in the selected date range ({startDate || 'Start'} to {endDate || 'End'}). Try selecting 'All Time'.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((ev) => {
                    const b = calculateEventHouseBreakdown(ev.id, filteredParticipations, safeStudents);
                    const total = b.Red + b.Blue + b.Green + b.Yellow;

                    return (
                      <tr key={ev.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{ev.name}</td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{ev.department}</td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">{ev.date}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-rose-600 dark:text-rose-400 font-mono">{b.Red}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-sky-600 dark:text-sky-400 font-mono">{b.Blue}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 font-mono">{b.Green}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-amber-600 dark:text-amber-400 font-mono">{b.Yellow}</td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white font-mono bg-slate-50/50 dark:bg-slate-800/50">
                          {total}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 3: DEPARTMENT ANALYTICS                                            */}
      {/* ========================================================================= */}
      {activeReportTab === 'departments' && (
        <div className="space-y-6">
          {/* Department Points Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white font-display">
              Department Achievement Distribution {isFilterActive ? `(${startDate} to ${endDate})` : ''}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {currentDeptStats.slice(0, 6).map((d) => {
                const pct = Math.round((d.achievementPoints / maxDeptPoints) * 100);
                return (
                  <div key={d.department} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{d.department}</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{d.achievementPoints} pts</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.max(5, pct)}%` }} />
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between">
                      <span>{d.studentCount} Students</span>
                      <span>{d.participationCount} Events</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white font-display">
                  Department-wise Performance Audit
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Evaluates student involvement, event registration volume, and verified honors won across all academic disciplines.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={handleDownloadPDF}
                  className="print:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-pointer transition"
                  title="Download PDF"
                >
                  <FileText className="w-3 h-3" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="print:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition"
                  title="Export CSV"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4 text-center">Enrolled Students</th>
                    <th className="py-3.5 px-4 text-center">Event Participations</th>
                    <th className="py-3.5 px-4 text-center">Avg Participations/Std</th>
                    <th className="py-3.5 px-4 text-center">Achievements Won</th>
                    <th className="py-3.5 px-4 text-right">Achievement Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentDeptStats.map((d) => {
                    const avgPart = d.studentCount > 0 ? (d.participationCount / d.studentCount).toFixed(2) : '0';

                    return (
                      <tr key={d.department} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{d.department}</td>
                        <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300 font-medium">{d.studentCount}</td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-800 dark:text-slate-200">{d.participationCount}</td>
                        <td className="py-3.5 px-4 text-center text-slate-500 dark:text-slate-400 font-mono">{avgPart}</td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-800 dark:text-slate-200">{d.achievementCount}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-amber-700 dark:text-amber-400 font-mono">
                          {d.achievementPoints} pts
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 4: ACADEMIC YEAR COHORTS                                           */}
      {/* ========================================================================= */}
      {activeReportTab === 'years' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white font-display">
                Academic Year Engagement & Activity Statistics
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tracking participation rates and competitive awards from 1st Year to 4th Year student cohorts {isFilterActive ? `(${startDate} to ${endDate})` : ''}.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleDownloadPDF}
                className="print:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-pointer transition"
                title="Download PDF"
              >
                <FileText className="w-3 h-3" />
                <span>PDF</span>
              </button>
              <button
                onClick={handleDownloadCSV}
                className="print:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition"
                title="Export CSV"
              >
                <Download className="w-3 h-3" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Academic Year</th>
                  <th className="py-3.5 px-4 text-center">Enrolled Students</th>
                  <th className="py-3.5 px-4 text-center">Event Participations</th>
                  <th className="py-3.5 px-4 text-center">Achievements Recorded</th>
                  <th className="py-3.5 px-4 text-right">Engagement Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentYearStats.map((y) => (
                  <tr key={y.year} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{y.year}</td>
                    <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300 font-medium">{y.studentCount}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-700 dark:text-indigo-400 font-mono">
                      {y.participationCount} entries
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-amber-700 dark:text-amber-400 font-mono">
                      {y.achievementCount} wins
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Active Cohort
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOWNLOAD REPORT MODAL                                                     */}
      {/* ========================================================================= */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white font-display">
                    Download Report
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Client-side conversion of currently active analytics table {isFilterActive ? `(Filtered: ${startDate} to ${endDate})` : '(All-Time)'}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Options */}
            <div className="p-6 space-y-4">
              {/* Active Tab Preview Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Source Active Analytics State
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {tabInfo[activeReportTab].icon} {tabInfo[activeReportTab].title}
                  </span>
                  {isFilterActive && (
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block font-semibold mt-0.5">
                      📅 Range: {startDate} → {endDate}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Ready to Convert
                </span>
              </div>

              {/* Option 1: PDF Document (.pdf) */}
              <div
                onClick={handleDownloadPDF}
                className="group p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-800/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all cursor-pointer flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      Download as PDF File (.pdf)
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                      jspdf-autotable
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Converts current table state into a styled collegiate PDF with institutional header, summary metrics, vector chart graphic, and auto-pagination.
                  </p>
                </div>
              </div>

              {/* Option 2: CSV Spreadsheet (.csv) */}
              <div
                onClick={handleDownloadCSV}
                className="group p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-slate-800/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all cursor-pointer flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      Download as CSV File (.csv)
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Spreadsheet
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Extracts structured data for "{tabInfo[activeReportTab].title}" with active date-range filter into a UTF-8 CSV formatted file.
                  </p>
                </div>
              </div>

              {/* Option 3: Full Consolidated Institutional Audit Package */}
              <div
                onClick={handleDownloadFullAuditCSV}
                className="group p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-slate-800/40 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all cursor-pointer flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      Full Consolidated Audit Package (CSV)
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      All 4 Tables
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Combines House Standings, Department Performance, Cohort Engagement, and Event Matrix into a single structured master document.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Pure client-side conversion • UTF-8 & jspdf-autotable
              </span>
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
