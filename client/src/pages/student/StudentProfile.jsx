import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { updateStudentProfile } from "../../api/student";
import { STUDENT_LINKS } from "./studentLinks";
import { User, Shield, Check, Lock, GraduationCap, Award, BookOpen, Layers } from "lucide-react";

export default function StudentProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [gender, setGender] = useState(user?.gender || "Male");
  const [section, setSection] = useState(user?.section || "A");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Academic Details State
  const [acad, setAcad] = useState({
    tenthPercentage: user?.academicDetails?.tenthPercentage || "",
    tenthBoard: user?.academicDetails?.tenthBoard || "",
    tenthPassingYear: user?.academicDetails?.tenthPassingYear || "",
    qualificationType: user?.academicDetails?.qualificationType || "12th",
    twelfthPercentage: user?.academicDetails?.twelfthPercentage || "",
    twelfthBoard: user?.academicDetails?.twelfthBoard || "",
    twelfthPassingYear: user?.academicDetails?.twelfthPassingYear || "",
    diplomaPercentage: user?.academicDetails?.diplomaPercentage || "",
    diplomaBranch: user?.academicDetails?.diplomaBranch || "",
    diplomaPassingYear: user?.academicDetails?.diplomaPassingYear || "",
    currentCgpa: user?.academicDetails?.currentCgpa || "",
    currentSemester: user?.academicDetails?.currentSemester || "Semester 7",
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const updateAcad = (field, val) => {
    setAcad((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await updateStudentProfile({
        name,
        gender,
        section,
        academicDetails: {
          tenthPercentage: acad.tenthPercentage ? Number(acad.tenthPercentage) : undefined,
          tenthBoard: acad.tenthBoard,
          tenthPassingYear: acad.tenthPassingYear,
          qualificationType: acad.qualificationType,
          twelfthPercentage: acad.twelfthPercentage ? Number(acad.twelfthPercentage) : undefined,
          twelfthBoard: acad.twelfthBoard,
          twelfthPassingYear: acad.twelfthPassingYear,
          diplomaPercentage: acad.diplomaPercentage ? Number(acad.diplomaPercentage) : undefined,
          diplomaBranch: acad.diplomaBranch,
          diplomaPassingYear: acad.diplomaPassingYear,
          currentCgpa: acad.currentCgpa ? Number(acad.currentCgpa) : undefined,
          currentSemester: acad.currentSemester,
        },
        password: password || undefined,
      });

      if (res?.user && updateUser) {
        updateUser(res.user);
      }

      setSaved(true);
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      active="profile"
      links={STUDENT_LINKS}
      onNavigate={(path) => navigate(path)}
    >
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-1">
          <User size={24} className="text-accent" />
          <h1 className="font-display text-[26px] font-bold">My Profile & Academic Credentials</h1>
        </div>
        <p className="text-ink-soft text-[13.5px]">
          Manage your personal details, 10th, 12th/Diploma qualifications, current CGPA pointer, and account security.
        </p>
      </div>

      {saved && (
        <div className="bg-success/10 border border-success/30 text-success text-[13.5px] px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <Check size={16} /> Profile & Academic details updated successfully!
        </div>
      )}

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-[13.5px] px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Hall Ticket Card */}
        <div className="bg-white border border-line rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-blue-400 text-white font-bold text-2xl flex items-center justify-center mb-3 shadow-md shadow-accent/20">
            {user?.name?.charAt(0)?.toUpperCase() || "S"}
          </div>

          <h2 className="font-display text-lg font-bold text-ink">{user?.name}</h2>
          <div className="font-mono text-[12px] text-accent font-semibold mb-2">{user?.erpNumber || "ERP: —"}</div>

          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide uppercase px-3 py-1 rounded-full bg-success/10 text-success font-semibold mb-4">
            <Shield size={12} /> Approved Student
          </span>

          {/* Academic Highlights Pill */}
          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 text-left text-xs space-y-2">
            <div className="font-bold flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1.5 text-indigo-600"><GraduationCap size={15} /> Degree CGPA:</span>
              <span className="font-mono text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {user?.academicDetails?.currentCgpa ? `${user.academicDetails.currentCgpa} CGPA` : "Not Added"}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Semester:</span>
              <span className="font-semibold text-slate-800">{user?.academicDetails?.currentSemester || "—"}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>10th Score:</span>
              <span className="font-semibold text-slate-800">{user?.academicDetails?.tenthPercentage ? `${user.academicDetails.tenthPercentage}%` : "—"}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>{user?.academicDetails?.qualificationType === "Diploma" ? "Diploma Score:" : "12th Score:"}</span>
              <span className="font-semibold text-slate-800">
                {user?.academicDetails?.qualificationType === "Diploma"
                  ? (user?.academicDetails?.diplomaPercentage ? `${user.academicDetails.diplomaPercentage}%` : "—")
                  : (user?.academicDetails?.twelfthPercentage ? `${user.academicDetails.twelfthPercentage}%` : "—")}
              </span>
            </div>
          </div>

          <div className="w-full text-left space-y-3 pt-4 border-t border-line text-[13px]">
            <div className="flex justify-between">
              <span className="text-ink-soft">Department:</span>
              <span className="font-semibold text-ink">{user?.branch || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Academic Year:</span>
              <span className="font-semibold text-ink">{user?.year || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Section:</span>
              <span className="font-semibold text-ink">{user?.section || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Email:</span>
              <span className="font-semibold text-ink truncate max-w-[170px]">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Edit Profile & Academic Credentials Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold text-ink mb-4 flex items-center gap-2">
                <User size={18} className="text-accent" /> Basic Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5">
                    Full Name
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5">
                      Gender
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5">
                      Section
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Credentials (10th, 12th/Diploma, CGPA Pointer) */}
            <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold text-ink mb-1 flex items-center gap-2">
                <GraduationCap size={20} className="text-indigo-600" /> Academic Credentials & Performance
              </h2>
              <p className="text-xs text-ink-soft mb-5">
                Fill in your 10th, 12th or Diploma marks, and your cumulative CGPA pointer up to your current semester.
              </p>

              {/* Current CGPA Pointer & Semester */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-3 flex items-center gap-1.5">
                  <Award size={15} /> Current Degree Performance Pointer
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                      Current Cumulative CGPA Pointer *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="e.g. 8.75"
                      className="w-full px-3.5 py-2 border-[1.5px] border-indigo-200 rounded-lg bg-white text-sm font-bold text-indigo-900 outline-none focus:border-indigo-600 transition-colors"
                      value={acad.currentCgpa}
                      onChange={(e) => updateAcad("currentCgpa", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                      Current Semester
                    </label>
                    <select
                      className="w-full px-3.5 py-2 border-[1.5px] border-indigo-200 rounded-lg bg-white text-sm font-medium text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                      value={acad.currentSemester}
                      onChange={(e) => updateAcad("currentSemester", e.target.value)}
                    >
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                      <option value="Semester 3">Semester 3</option>
                      <option value="Semester 4">Semester 4</option>
                      <option value="Semester 5">Semester 5</option>
                      <option value="Semester 6">Semester 6</option>
                      <option value="Semester 7">Semester 7</option>
                      <option value="Semester 8">Semester 8</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 10th Class Details */}
              <div className="mb-6 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <BookOpen size={15} className="text-slate-500" /> 10th (SSC / Class X) Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1">
                      10th Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="e.g. 88.50"
                      className="w-full px-3.5 py-2 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors"
                      value={acad.tenthPercentage}
                      onChange={(e) => updateAcad("tenthPercentage", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1">
                      Board / School
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. State Board / CBSE / ICSE"
                      className="w-full px-3.5 py-2 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors"
                      value={acad.tenthBoard}
                      onChange={(e) => updateAcad("tenthBoard", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1">
                      Passing Year
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2020"
                      className="w-full px-3.5 py-2 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors font-mono"
                      value={acad.tenthPassingYear}
                      onChange={(e) => updateAcad("tenthPassingYear", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Qualification Choice (12th vs Diploma) */}
              <div className="pt-4 border-t border-line">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Layers size={15} className="text-slate-500" /> Pre-Engineering Qualification
                  </h3>

                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => updateAcad("qualificationType", "12th")}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        acad.qualificationType === "12th"
                          ? "bg-white text-indigo-600 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      12th (HSC)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAcad("qualificationType", "Diploma")}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        acad.qualificationType === "Diploma"
                          ? "bg-white text-blue-600 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Polytechnic Diploma
                    </button>
                  </div>
                </div>

                {acad.qualificationType === "12th" ? (
                  /* 12th Details */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1">
                        12th Percentage (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="e.g. 85.40"
                        className="w-full px-3.5 py-2 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors"
                        value={acad.twelfthPercentage}
                        onChange={(e) => updateAcad("twelfthPercentage", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1">
                        12th Board
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. HSC Board / CBSE"
                        className="w-full px-3.5 py-2 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors"
                        value={acad.twelfthBoard}
                        onChange={(e) => updateAcad("twelfthBoard", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1">
                        Passing Year
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2022"
                        className="w-full px-3.5 py-2 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors font-mono"
                        value={acad.twelfthPassingYear}
                        onChange={(e) => updateAcad("twelfthPassingYear", e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  /* Diploma Details */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1">
                        Diploma Percentage (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="e.g. 82.30"
                        className="w-full px-3.5 py-2 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors"
                        value={acad.diplomaPercentage}
                        onChange={(e) => updateAcad("diplomaPercentage", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1">
                        Diploma Branch
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Computer Engineering"
                        className="w-full px-3.5 py-2 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors"
                        value={acad.diplomaBranch}
                        onChange={(e) => updateAcad("diplomaBranch", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1">
                        Passing Year
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2022"
                        className="w-full px-3.5 py-2 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors font-mono"
                        value={acad.diplomaPassingYear}
                        onChange={(e) => updateAcad("diplomaPassingYear", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Change Password (Optional) */}
            <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
              <h3 className="font-display text-base font-bold text-ink mb-3 flex items-center gap-2">
                <Lock size={16} className="text-accent" /> Security & Password Settings
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div>
              <button
                type="submit"
                disabled={saving}
                className="bg-accent text-white rounded-xl px-8 py-3 font-bold text-sm hover:bg-accent-hover transition-colors shadow-md shadow-accent/25 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving Changes…
                  </>
                ) : (
                  <>
                    <Check size={18} /> Save All Profile & Academic Details
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
