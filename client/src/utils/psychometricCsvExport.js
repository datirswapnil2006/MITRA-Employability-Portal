/**
 * Utility to export institutional candidate psychometric results to CSV.
 */
export const exportPsychometricCSV = (attemptLogs = []) => {
  if (!attemptLogs || attemptLogs.length === 0) {
    alert("No candidate attempt data available to export.");
    return;
  }

  const headers = [
    "Candidate Name",
    "ERP Number",
    "Branch",
    "Year",
    "Assessment Title",
    "Category",
    "Primary Archetype",
    "Completion Date",
    "Openness %",
    "Conscientiousness %",
    "Extraversion %",
    "Agreeableness %",
    "Emotional Stability %",
  ];

  const rows = attemptLogs.map((a) => {
    const traitMap = {};
    (a.traitBreakdown || []).forEach((t) => {
      traitMap[t.key] = t.percentage;
    });

    const dateStr = a.completedAt ? new Date(a.completedAt).toISOString().split("T")[0] : "—";

    return [
      `"${a.studentName || "Candidate"}"`,
      `"${a.erpNumber || "—"}"`,
      `"${a.branch || "General"}"`,
      `"${a.year || "—"}"`,
      `"${(a.testTitle || "Assessment").replace(/"/g, '""')}"`,
      `"${a.category || "—"}"`,
      `"${a.archetype || "Adaptive Professional"}"`,
      `"${dateStr}"`,
      traitMap.openness !== undefined ? traitMap.openness : "—",
      traitMap.conscientiousness !== undefined ? traitMap.conscientiousness : "—",
      traitMap.extraversion !== undefined ? traitMap.extraversion : "—",
      traitMap.agreeableness !== undefined ? traitMap.agreeableness : "—",
      traitMap.emotional_stability !== undefined ? traitMap.emotional_stability : "—",
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `mitra_psychometric_export_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
