import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getAllStudents, BRANCHES, YEARS } from "../../api/tests";
import { ADMIN_LINKS } from "./adminLinks";
import { Search, Filter, RefreshCw, Users, X, FileSpreadsheet, Download } from "lucide-react";
import * as XLSX from "xlsx";

const ghostBtn = "border-[1.5px] border-line rounded px-4 py-2 font-semibold text-[13px] text-ink hover:border-accent transition-colors";
const th = "text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-soft bg-slate-100 px-4 py-3 border-b border-line";
const td = "px-4 py-3.5 border-b border-slate-100 text-[13.5px]";
const selectCls = "px-3 py-2 border-[1.5px] border-line rounded bg-white text-sm text-ink outline-none focus:border-accent transition-colors font-medium";

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchStudents = () => {
    setLoading(true);
    getAllStudents({ branch, year, search })
      .then(setStudents)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, [branch, year, search]);

  const handleResetFilters = () => {
    setBranch("");
    setYear("");
    setSearch("");
  };

  const handleExportExcel = () => {
    if (!students || students.length === 0) {
      alert("No student data available to export.");
      return;
    }

    const exportData = students.map((s, index) => {
      const acad = s.academicDetails || {};
      return {
        "Sr. No.": index + 1,
        "Student Name": s.name || "",
        "ERP Number": s.erpNumber || "",
        "Email Address": s.email || "",
        "Gender": s.gender || "",
        "Department / Branch": s.branch || "",
        "Academic Year": s.year || "",
        "Section": s.section || "",
        "Current Semester": acad.currentSemester || "",
        "Current CGPA Pointer": acad.currentCgpa !== undefined && acad.currentCgpa !== null ? acad.currentCgpa : "",
        "10th Percentage (%)": acad.tenthPercentage !== undefined && acad.tenthPercentage !== null ? acad.tenthPercentage : "",
        "10th Board": acad.tenthBoard || "",
        "10th Passing Year": acad.tenthPassingYear || "",
        "Qualification Type": acad.qualificationType || "",
        "12th Percentage (%)": acad.qualificationType === "12th" ? (acad.twelfthPercentage ?? "") : "N/A",
        "12th Board": acad.qualificationType === "12th" ? (acad.twelfthBoard ?? "") : "N/A",
        "12th Passing Year": acad.qualificationType === "12th" ? (acad.twelfthPassingYear ?? "") : "N/A",
        "Diploma Percentage (%)": acad.qualificationType === "Diploma" ? (acad.diplomaPercentage ?? "") : "N/A",
        "Diploma Branch": acad.qualificationType === "Diploma" ? (acad.diplomaBranch ?? "") : "N/A",
        "Diploma Passing Year": acad.qualificationType === "Diploma" ? (acad.diplomaPassingYear ?? "") : "N/A",
        "Tests Taken": s.testsTaken || 0,
        "Average Score (%)": s.averagePercent !== null && s.averagePercent !== undefined ? `${s.averagePercent}%` : "N/A",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
      wch: Math.max(key.length + 3, 14),
    }));
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Profiles");

    const fileNameBranch = branch ? branch.replace(/[^a-zA-Z0-9]/g, "_") : "All_Branches";
    const fileNameYear = year ? year.replace(/[^a-zA-Z0-9]/g, "_") : "All_Years";
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `Student_Profiles_${fileNameBranch}_${fileNameYear}_${timestamp}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  return (
    <DashboardLayout active="students" links={ADMIN_LINKS} onNavigate={(k) => navigate(k === "overview" ? "/admin" : `/admin/${k}`)}>
      <div className="mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] mb-1 flex items-center gap-2">
            <Users className="text-indigo-600" size={24} /> Student Management
          </h1>
          <p className="text-ink-soft text-[13.5px] m-0">View, filter, and download student profiles by department, academic year, or academic pointers.</p>
        </div>

        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-indigo-700 self-start sm:self-auto">
          {students.length} Students Listed
        </div>
      </div>

      {/* Export Section Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-800/60 text-white p-5 rounded-2xl mb-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="text-emerald-400" size={24} />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              Export Departmentwise Student Profiles
            </h2>
            <p className="text-emerald-200/80 text-xs leading-relaxed">
              Export structured Excel sheets containing Student Name, ERP Number, Email, Current CGPA Pointer, 10th & 12th/Diploma Marks according to your active filters.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={students.length === 0}
          className="bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
        >
          <Download size={16} /> Download Excel Sheet (.xlsx)
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white border border-line p-4 rounded-xl mb-6 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Name or ERP Number..."
              className="w-full pl-9 pr-3 py-2 border-[1.5px] border-line rounded bg-white text-xs text-ink outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Department / Branch Dropdown */}
          <select className={selectCls} value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">All Departments / Branches</option>
            {BRANCHES.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Academic Year Dropdown */}
          <select className={selectCls} value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">All Academic Years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {(branch || year || search) && (
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 rounded transition-colors"
          >
            <X size={14} /> Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse">
          Loading student management roster…
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white border border-line rounded-xl text-center py-12 text-ink-soft space-y-2">
          <p className="font-semibold text-slate-700">No students match your filter criteria.</p>
          {(branch || year || search) && (
            <button onClick={handleResetFilters} className="text-xs text-accent font-bold hover:underline">
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm">
          <thead>
            <tr>
              {["Name", "ERP Number", "Department", "CGPA Pointer", "10th / 12th Marks", "Tests Taken", "Avg. Score", ""].map((h) => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const acad = s.academicDetails || {};
              const pointer = acad.currentCgpa !== undefined && acad.currentCgpa !== null ? `${acad.currentCgpa} CGPA` : "—";
              const tenth = acad.tenthPercentage ? `${acad.tenthPercentage}%` : "—";
              const twelfth = acad.qualificationType === "Diploma"
                ? (acad.diplomaPercentage ? `Dip: ${acad.diplomaPercentage}%` : "Dip: —")
                : (acad.twelfthPercentage ? `12th: ${acad.twelfthPercentage}%` : "12th: —");

              return (
                <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                  <td className={td}>
                    <strong>{s.name}</strong><br />
                    <span className="text-ink-soft text-xs">{s.email}</span>
                  </td>
                  <td className={`${td} font-mono font-bold text-indigo-600`}>{s.erpNumber}</td>
                  <td className={td}>
                    <span className="bg-slate-100 font-mono font-bold text-[11px] px-2.5 py-1 rounded text-slate-700 border border-slate-200">
                      {s.branch || "—"}
                    </span>
                    <div className="text-[11px] text-ink-soft mt-0.5">{s.year} (Sec {s.section})</div>
                  </td>
                  <td className={td}>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-xs">
                      {pointer}
                    </span>
                    {acad.currentSemester && (
                      <div className="text-[10.5px] text-slate-500 mt-0.5">{acad.currentSemester}</div>
                    )}
                  </td>
                  <td className={td}>
                    <div className="text-xs font-medium text-slate-800">10th: <strong>{tenth}</strong></div>
                    <div className="text-xs text-slate-600">{twelfth}</div>
                  </td>
                  <td className={td}>{s.testsTaken}</td>
                  <td className={td}>{s.averagePercent !== null ? `${s.averagePercent}%` : "—"}</td>
                  <td className={td}>
                    <button className={ghostBtn} onClick={() => navigate(`/admin/students/${s._id}`)}>View Profile</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </DashboardLayout>
  );
}
