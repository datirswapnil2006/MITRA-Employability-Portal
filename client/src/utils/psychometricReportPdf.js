/**
 * Utility helper to generate and print a formal candidate Psychometric Dossier Report.
 */
export const downloadPsychometricPDF = (analysisData) => {
  const { student, test, completedAt, personalityProfile, traitBreakdown, strengths, developmentAreas, workplaceStyle, careerRecommendations } = analysisData;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download your PDF report.");
    return;
  }

  const dateStr = completedAt ? new Date(completedAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString();

  const traitsHtml = (traitBreakdown || [])
    .map(
      (t) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${t.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${t.percentage}%</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">${t.level}</td>
      </tr>
    `
    )
    .join("");

  const strengthsHtml = (strengths || []).map((s) => `<li style="margin-bottom: 4px;">${s}</li>`).join("");
  const areasHtml = (developmentAreas || []).map((a) => `<li style="margin-bottom: 4px;">${a}</li>`).join("");
  const careersHtml = (careerRecommendations || []).map((c) => `<span style="display: inline-block; background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 6px; margin: 3px; font-weight: 600; font-size: 11px;">${c}</span>`).join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Psychometric Dossier - ${student?.name || "Candidate"}</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; padding: 40px; margin: 0; line-height: 1.5; font-size: 13px; }
          .header { border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
          .logo { font-size: 22px; font-weight: 800; color: #6366f1; letter-spacing: -0.5px; }
          .sub { color: #64748b; font-size: 12px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
          .title { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 4px; }
          .tagline { color: #6366f1; font-weight: 600; font-size: 12px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { text-align: left; background: #f1f5f9; padding: 8px 12px; font-size: 11px; text-transform: uppercase; color: #475569; }
          .grid { display: flex; gap: 16px; }
          .col { flex: 1; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">MITRA EMPLOYABILITY PORTAL</div>
            <div class="sub">Official Candidate Psychometric & Behavioral Evaluation Dossier</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700;">${student?.name || "Candidate"}</div>
            <div class="sub">ERP: ${student?.erpNumber || "—"} | ${student?.branch || "Department"}</div>
            <div class="sub">Completed: ${dateStr}</div>
          </div>
        </div>

        <div class="card" style="background: #eef2ff; border-color: #c7d2fe;">
          <div class="tagline">PRIMARY BEHAVIORAL ARCHETYPE</div>
          <div class="title" style="font-size: 20px; color: #3730a3;">${personalityProfile?.archetype || "Adaptive Professional"}</div>
          <div style="font-weight: 600; color: #4f46e5; margin-bottom: 6px;">"${personalityProfile?.tagline || ""}"</div>
          <div style="color: #334155; font-size: 12px;">${personalityProfile?.description || ""}</div>
        </div>

        <div class="card">
          <div class="title">Trait Evaluation Breakdown</div>
          <table>
            <thead>
              <tr>
                <th>Behavioral Trait</th>
                <th>Score (%)</th>
                <th>Competency Level</th>
              </tr>
            </thead>
            <tbody>
              ${traitsHtml}
            </tbody>
          </table>
        </div>

        <div class="grid">
          <div class="col card">
            <div class="title" style="color: #166534;">Behavioral Strengths</div>
            <ul style="padding-left: 16px; margin: 0;">
              ${strengthsHtml}
            </ul>
          </div>
          <div class="col card">
            <div class="title" style="color: #9a3412;">Development Areas</div>
            <ul style="padding-left: 16px; margin: 0;">
              ${areasHtml}
            </ul>
          </div>
        </div>

        <div class="card">
          <div class="title">Workplace & Team Dynamics</div>
          <div style="margin-bottom: 6px;"><strong>Communication:</strong> ${workplaceStyle?.communication || "Collaborative"}</div>
          <div style="margin-bottom: 6px;"><strong>Stress Response:</strong> ${workplaceStyle?.stressResponse || "Composed"}</div>
          <div style="margin-bottom: 6px;"><strong>Decision Making:</strong> ${workplaceStyle?.decisionMaking || "Methodical"}</div>
          <div><strong>Ideal Team Role:</strong> ${workplaceStyle?.teamRole || "Core Technical Contributor"}</div>
        </div>

        <div class="card">
          <div class="title">Recommended Career & Role Paths</div>
          <div>${careersHtml}</div>
        </div>

        <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #94a3b8;">
          Report generated automatically by MITRA Employability Portal Psychometric Scoring Engine.
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
