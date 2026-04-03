import React, { useState, useEffect } from "react";
import StatusBadge from "../components/common/StatusBadge.jsx";
import Spinner from "../components/common/Spinner.jsx";
import {
  getDashboardStats,
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  getClassrooms,
  addClassroom,
  updateClassroom,
  deleteClassroom,
  getAttendanceReports
} from "../services/adminService.js";
import { compressImage, fileToBase64 } from "../utils/imageUtils.js";

/* ── Holographic section heading ── */
const SectionTitle = ({ icon, title, desc }) => (
  <div style={{ marginBottom: "1.25rem" }}>
    <div style={{
      display: "flex", alignItems: "center", gap: "0.6rem",
      marginBottom: "0.3rem"
    }}>
      <span style={{ fontSize: "1.2rem" }}>{icon}</span>
      <div style={{
        fontFamily: "'Orbitron', monospace",
        fontSize: "1rem", fontWeight: 700,
        color: "var(--text-primary)", letterSpacing: "0.06em",
        textTransform: "uppercase"
      }}>{title}</div>
    </div>
    <div style={{
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: "0.82rem", color: "var(--text-muted)"
    }}>{desc}</div>
  </div>
);

/* ── Tab bar ── */
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{
    display: "flex", gap: "0.25rem",
    padding: "0.3rem",
    background: "var(--black-card)",
    border: "1px solid var(--holo-border)",
    borderRadius: "6px",
    marginBottom: "1.25rem",
    flexWrap: "wrap"
  }}>
    {tabs.map(t => (
      <button
        key={t.key}
        onClick={() => onChange(t.key)}
        style={{
          flex: "1 1 auto",
          padding: "0.5rem 0.75rem",
          borderRadius: "4px",
          border: "none",
          background: active === t.key
            ? "linear-gradient(135deg, var(--gold-deep), var(--gold-mid))"
            : "transparent",
          color: active === t.key ? "var(--black-pure)" : "var(--text-muted)",
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: "0.78rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: "pointer",
          transition: "all 0.2s",
          whiteSpace: "nowrap"
        }}
      >{t.icon} {t.label}</button>
    ))}
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({ students: 0, faculty: 0, classrooms: 0 });
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filters, setFilters] = useState({ date: "", subject: "", className: "" });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("students");

  const [newStudent, setNewStudent] = useState({ name: "", rollNo: "", branch: "", year: "", email: "", phone: "", faceImages: [], password: "" });
  const [newFaculty, setNewFaculty] = useState({ name: "", subject: "", department: "", email: "", phone: "", password: "" });
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [showFacultyPassword, setShowFacultyPassword] = useState(false);
  const [newClassroom, setNewClassroom] = useState({ name: "", building: "", floor: "", referenceImages: [] });

  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const [showLivelinessModal, setShowLivelinessModal] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [classroomImages, setClassroomImages] = useState([]);
  const [livelinessError, setLivelinessError] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, studentsData, facultyData, classroomsData, reportsData] = await Promise.all([
        getDashboardStats(),
        getUsers("student"),
        getUsers("faculty"),
        getClassrooms(),
        getAttendanceReports(filters)
      ]);
      setStats(statsData);
      setStudents(studentsData);
      setFaculty(facultyData);
      setClassrooms(classroomsData);
      setAttendanceRecords(reportsData);
    } catch (err) {
      setError("Failed to load dashboard data. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      getAttendanceReports(filters).then(setAttendanceRecords).catch(console.error);
    }, 500);
    return () => clearTimeout(debounce);
  }, [filters]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.rollNo || !newStudent.email || !newStudent.password) {
      alert("Please fill all required fields including password"); return;
    }
    try {
      await addUser({ ...newStudent, role: "student" });
      setNewStudent({ name: "", rollNo: "", branch: "", year: "", email: "", phone: "", faceImages: [], password: "" });
      fetchData();
    } catch (err) { alert(err.response?.data?.message || "Failed to add student"); }
  };

  const handleFaceImageChange = async (e, index) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      try {
        const compressedFile = await compressImage(file);
        const base64 = await fileToBase64(compressedFile);
        const updatedImages = [...newStudent.faceImages];
        updatedImages[index] = base64;
        setNewStudent({ ...newStudent, faceImages: updatedImages });
      } catch (err) { alert("Failed to process image."); }
    }
  };

  const handleRemoveFaceImage = (index) => {
    const updatedImages = [...newStudent.faceImages];
    updatedImages.splice(index, 1);
    setNewStudent({ ...newStudent, faceImages: updatedImages });
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try { await deleteUser(id); fetchData(); }
    catch (err) { alert("Failed to delete user"); }
  };

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    if (!newFaculty.name || !newFaculty.subject || !newFaculty.email || !newFaculty.password) {
      alert("Please fill all required fields including password"); return;
    }
    try {
      await addUser({ ...newFaculty, role: "faculty" });
      setNewFaculty({ name: "", subject: "", department: "", email: "", phone: "", password: "" });
      fetchData();
    } catch (err) { alert(err.response?.data?.message || "Failed to add faculty"); }
  };

  const handleAddClassroom = async (e) => {
    e.preventDefault();
    if (!newClassroom.name || !newClassroom.building) return;
    try {
      await addClassroom(newClassroom);
      setNewClassroom({ name: "", building: "", floor: "", referenceImages: [] });
      fetchData();
    } catch (err) { alert(err.response?.data?.message || "Failed to add classroom"); }
  };

  const handleDeleteClassroom = async (id) => {
    if (!window.confirm("Delete this classroom?")) return;
    try { await deleteClassroom(id); fetchData(); }
    catch (err) { alert("Failed to delete classroom"); }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({ ...user });
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    try {
      await updateUser(editingUser._id, editFormData);
      setShowEditModal(false);
      setEditingUser(null);
      fetchData();
      alert("User updated successfully");
    } catch (err) { alert(err.response?.data?.message || "Failed to update user"); }
  };

  const handleOpenLivelinessModal = (classroom) => {
    setSelectedClassroom(classroom);
    setClassroomImages(classroom.referenceImages || []);
    setShowLivelinessModal(true);
    setLivelinessError("");
  };

  const handleCloseLivelinessModal = () => {
    setShowLivelinessModal(false);
    setSelectedClassroom(null);
    setClassroomImages([]);
    setLivelinessError("");
  };

  const handleClassroomImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    const processedImages = [];
    try {
      for (const file of files) {
        const compressed = await compressImage(file);
        const base64 = await fileToBase64(compressed);
        processedImages.push(base64);
      }
      setClassroomImages(prev => [...prev, ...processedImages]);
    } catch (err) { setLivelinessError("Failed to process some images."); }
    finally { setUploadingImages(false); }
  };

  const handleRemoveClassroomImageItem = (index) => {
    setClassroomImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveLiveliness = async () => {
    if (classroomImages.length < 6) {
      setLivelinessError("Minimum 6 images are required for liveliness detection.");
      return;
    }
    setUploadingImages(true);
    setLivelinessError("");
    try {
      await updateClassroom(selectedClassroom._id, { referenceImages: classroomImages });
      setClassrooms(prev => prev.map(c => c._id === selectedClassroom._id ? { ...c, referenceImages: classroomImages } : c));
      handleCloseLivelinessModal();
      alert("Classroom images updated successfully!");
    } catch (err) { setLivelinessError(err.response?.data?.message || "Failed to save images."); }
    finally { setUploadingImages(false); }
  };

  if (loading && !stats.students) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "1rem" }}>
        <Spinner />
        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.15em" }}>LOADING ADMIN DASHBOARD…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <div className="error-text" style={{ marginBottom: "1rem" }}>{error}</div>
        <button className="btn btn-primary" onClick={fetchData}>↩ Retry</button>
      </div>
    );
  }

  const tabs = [
    { key: "students",   icon: "🎓", label: "Students" },
    { key: "faculty",    icon: "👨‍🏫", label: "Faculty" },
    { key: "classrooms", icon: "🏫", label: "Classrooms" },
    { key: "reports",    icon: "📊", label: "Reports" }
  ];

  return (
    <section className="admin-dashboard">
      {/* ── Header ── */}
      <div className="dashboard-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: "50px", height: "50px",
            background: "linear-gradient(135deg, var(--gold-deep), var(--gold-bright))",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.5rem", boxShadow: "0 0 16px var(--glow-gold)"
          }}>⚙️</div>
          <div>
            <h1 className="dashboard-title">Admin Panel</h1>
            <p className="dashboard-subtitle">MarkMe · Full System Control</p>
          </div>
        </div>

        <div className="dashboard-stats">
          {[
            { label: "Students", value: stats.students, icon: "🎓" },
            { label: "Faculty", value: stats.faculty, icon: "👨‍🏫" },
            { label: "Classrooms", value: stats.classrooms, icon: "🏫" }
          ].map(({ label, value, icon }) => (
            <div className="stat-item" key={label}>
              <div style={{ fontSize: "1.2rem", marginBottom: "0.2rem" }}>{icon}</div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* ═══════════════════════════════════
          TAB: STUDENTS
      ═══════════════════════════════════ */}
      {activeTab === "students" && (
        <div className="grid grid-2">
          {/* Add Student */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Add Student</div>
                <div className="card-subtitle">Register with face identification</div>
              </div>
              <StatusBadge status="success" label={`${students.length} registered`} />
            </div>

            <form onSubmit={handleAddStudent} className="student-form" autoComplete="off">
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Full Name *</label>
                  <input className="input-field" placeholder="Full name" value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} autoComplete="off" />
                </div>
                <div className="input-group">
                  <label className="input-label">Roll No *</label>
                  <input className="input-field" placeholder="e.g. 2023000367" value={newStudent.rollNo}
                    onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value })} autoComplete="off" />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Branch</label>
                  <input className="input-field" placeholder="CSE, ECE…" value={newStudent.branch}
                    onChange={(e) => setNewStudent({ ...newStudent, branch: e.target.value })} autoComplete="off" />
                </div>
                <div className="input-group">
                  <label className="input-label">Year</label>
                  <input className="input-field" placeholder="1st, 2nd…" value={newStudent.year}
                    onChange={(e) => setNewStudent({ ...newStudent, year: e.target.value })} autoComplete="off" />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Email *</label>
                <input type="email" className="input-field" placeholder="student@gitam.edu" value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} autoComplete="new-password" />
              </div>

              <div className="input-group">
                <label className="input-label">Phone</label>
                <input className="input-field" placeholder="Mobile number" value={newStudent.phone || ""}
                  onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })} autoComplete="off" />
              </div>

              <div className="input-group">
                <label className="input-label">Password *</label>
                <div style={{ position: "relative" }}>
                  <input type={showStudentPassword ? "text" : "password"} className="input-field"
                    placeholder="Set password" value={newStudent.password}
                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                    style={{ paddingRight: "40px" }} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowStudentPassword(!showStudentPassword)}
                    style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                    {showStudentPassword ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Face Photos (3 slots)</label>
                <div className="face-images-grid">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="face-image-slot">
                      <input type="file" accept="image/*" className="input-field"
                        onChange={(e) => handleFaceImageChange(e, index)}
                        style={{ fontSize: "11px", padding: "6px" }} />
                      {newStudent.faceImages[index] ? (
                        <div className="face-preview">
                          <img src={newStudent.faceImages[index]} alt={`Face ${index + 1}`} />
                          <button type="button" className="btn-remove-image"
                            onClick={() => handleRemoveFaceImage(index)}>Remove</button>
                        </div>
                      ) : (
                        <div className="face-placeholder">Slot {index + 1}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block">▶ Add Student</button>
            </form>
          </div>

          {/* Students table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Registered Students</div>
              <span className="chip chip-gold">{students.length} Total</span>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Photos</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s._id}>
                      <td style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.7rem", color: "var(--gold-mid)" }}>{s.rollNo || "—"}</td>
                      <td style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>{s.name}</td>
                      <td className="email-cell">{s.email || s.rollNo}</td>
                      <td>
                        {s.faceImages?.length > 0 ? (
                          <div className="face-thumbnails">
                            {s.faceImages.slice(0, 2).map((img, i) => (
                              <img key={i} src={img} alt="" className="face-thumbnail" />
                            ))}
                            {s.faceImages.length > 2 && (
                              <span className="chip chip-gold">+{s.faceImages.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="face-count-warning">No photos</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleEditUser(s)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(s._id)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}><span className="no-data">No students registered yet.</span></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
          TAB: FACULTY
      ═══════════════════════════════════ */}
      {activeTab === "faculty" && (
        <div className="grid grid-2">
          {/* Add Faculty */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Add Faculty</div>
                <div className="card-subtitle">Register teaching staff</div>
              </div>
              <StatusBadge status="success" label={`${faculty.length} registered`} />
            </div>

            <form onSubmit={handleAddFaculty} className="faculty-form" autoComplete="off">
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Full Name *</label>
                  <input className="input-field" placeholder="Dr. / Prof." value={newFaculty.name}
                    onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })} autoComplete="off" />
                </div>
                <div className="input-group">
                  <label className="input-label">Subject *</label>
                  <input className="input-field" placeholder="e.g. Data Structures" value={newFaculty.subject}
                    onChange={(e) => setNewFaculty({ ...newFaculty, subject: e.target.value })} autoComplete="off" />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Department</label>
                  <input className="input-field" placeholder="CSE, ECE…" value={newFaculty.department}
                    onChange={(e) => setNewFaculty({ ...newFaculty, department: e.target.value })} autoComplete="off" />
                </div>
                <div className="input-group">
                  <label className="input-label">Phone</label>
                  <input className="input-field" placeholder="Mobile" value={newFaculty.phone || ""}
                    onChange={(e) => setNewFaculty({ ...newFaculty, phone: e.target.value })} autoComplete="off" />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Email *</label>
                <input type="email" className="input-field" placeholder="faculty@gitam.edu" value={newFaculty.email}
                  onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })} autoComplete="new-password" />
              </div>

              <div className="input-group">
                <label className="input-label">Password *</label>
                <div style={{ position: "relative" }}>
                  <input type={showFacultyPassword ? "text" : "password"} className="input-field"
                    placeholder="Set password" value={newFaculty.password}
                    onChange={(e) => setNewFaculty({ ...newFaculty, password: e.target.value })}
                    style={{ paddingRight: "40px" }} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowFacultyPassword(!showFacultyPassword)}
                    style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                    {showFacultyPassword ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block">▶ Add Faculty</button>
            </form>
          </div>

          {/* Faculty table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Registered Faculty</div>
              <span className="chip chip-gold">{faculty.length} Total</span>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Subject</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {faculty.map((f) => (
                    <tr key={f._id}>
                      <td style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>{f.name}</td>
                      <td style={{ fontFamily: "'Rajdhani', sans-serif", color: "var(--gold-mid)" }}>{f.subject}</td>
                      <td className="email-cell">{f.email}</td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleEditUser(f)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(f._id)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {faculty.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}><span className="no-data">No faculty registered yet.</span></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
          TAB: CLASSROOMS
      ═══════════════════════════════════ */}
      {activeTab === "classrooms" && (
        <div className="grid grid-2">
          {/* Add Classroom */}
          <div className="card classroom-card">
            <div className="card-header">
              <div>
                <div className="card-title">Add Classroom</div>
                <div className="card-subtitle">Configure geo-fence location</div>
              </div>
            </div>
            <form onSubmit={handleAddClassroom} className="classroom-form">
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Room Name *</label>
                  <input className="input-field" placeholder="e.g. LH-101" value={newClassroom.name}
                    onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Building *</label>
                  <input className="input-field" placeholder="e.g. Block-A" value={newClassroom.building}
                    onChange={(e) => setNewClassroom({ ...newClassroom, building: e.target.value })} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Floor</label>
                <input className="input-field" placeholder="e.g. 2nd Floor" value={newClassroom.floor}
                  onChange={(e) => setNewClassroom({ ...newClassroom, floor: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary btn-block">▶ Add Classroom</button>
            </form>
          </div>

          {/* Classrooms list */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Classrooms</div>
              <span className="chip chip-gold">{classrooms.length} Total</span>
            </div>
            <div className="classrooms-list">
              {classrooms.map((c) => (
                <div key={c._id} className="classroom-item">
                  <div className="classroom-item-header">
                    <div>
                      <div className="classroom-name">{c.name}</div>
                      <div className="classroom-location">📍 {c.building}{c.floor ? ` · ${c.floor}` : ""}</div>
                    </div>
                    <div className="classroom-actions">
                      <span className="chip chip-gold">{c.referenceImages?.length || 0} imgs</span>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenLivelinessModal(c)}>
                        📷 Images
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClassroom(c._id)}>
                        Del
                      </button>
                    </div>
                  </div>
                  {c.referenceImages && c.referenceImages.length > 0 && (
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      {c.referenceImages.slice(0, 5).map((img, i) => (
                        <img key={i} src={img} alt="" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px", border: "1px solid var(--holo-border)" }} />
                      ))}
                      {c.referenceImages.length > 5 && (
                        <div style={{ width: "50px", height: "50px", background: "rgba(251,191,36,0.1)", border: "1px solid var(--holo-border)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Orbitron', monospace", fontSize: "0.7rem", color: "var(--gold-mid)" }}>
                          +{c.referenceImages.length - 5}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {classrooms.length === 0 && (
                <div className="empty-state">
                  <p>No classrooms added yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
          TAB: REPORTS
      ═══════════════════════════════════ */}
      {activeTab === "reports" && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Attendance Reports</div>
              <div className="card-subtitle">Filter and view all attendance records</div>
            </div>
            <span className="chip chip-gold">{attendanceRecords.length} Records</span>
          </div>

          {/* Filters */}
          <div className="filters-row">
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Date</label>
              <input type="date" className="input-field" value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Subject</label>
              <input className="input-field" placeholder="Filter by subject" value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Class</label>
              <input className="input-field" placeholder="Filter by class" value={filters.className}
                onChange={(e) => setFilters({ ...filters, className: e.target.value })} />
            </div>
            <div className="input-group" style={{ marginBottom: 0, justifyContent: "flex-end" }}>
              <label className="input-label">&nbsp;</label>
              <button className="btn btn-secondary" onClick={() => setFilters({ date: "", subject: "", className: "" })}>
                ✕ Clear
              </button>
            </div>
          </div>

          <div className="table-wrapper" style={{ marginTop: "0.75rem" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((r, i) => (
                  <tr key={r._id || i}>
                    <td style={{ color: "var(--text-muted)", fontFamily: "'Orbitron', monospace", fontSize: "0.65rem" }}>{i + 1}</td>
                    <td style={{ fontFamily: "'Rajdhani', sans-serif" }}>{r.date}</td>
                    <td style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>{r.studentName}</td>
                    <td style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.7rem", color: "var(--gold-mid)" }}>{r.rollNo}</td>
                    <td style={{ fontFamily: "'Rajdhani', sans-serif" }}>{r.subject}</td>
                    <td style={{ fontFamily: "'Rajdhani', sans-serif" }}>{r.className}</td>
                    <td>
                      <span className={`chip ${r.status === "Present" ? "chip-success" : "chip-danger"}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {attendanceRecords.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem" }}>
                      <span className="no-data">No attendance records match the filter.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
          MODAL: Edit User
      ═══════════════════════════════════ */}
      {showEditModal && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          z: 1000, zIndex: 1000, padding: "1rem"
        }}>
          <div className="card" style={{ maxWidth: "500px", width: "100%", zIndex: 1001 }}>
            <div className="card-header">
              <div className="card-title">Edit User — {editingUser?.name}</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowEditModal(false)}>✕ Close</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div className="input-group">
                <label className="input-label">Name</label>
                <input className="input-field" value={editFormData.name || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input type="email" className="input-field" value={editFormData.email || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} />
              </div>
              {editingUser?.role === "student" && (
                <>
                  <div className="form-row">
                    <div className="input-group">
                      <label className="input-label">Roll No</label>
                      <input className="input-field" value={editFormData.rollNo || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, rollNo: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Branch</label>
                      <input className="input-field" value={editFormData.branch || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value })} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Year</label>
                    <input className="input-field" value={editFormData.year || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })} />
                  </div>
                </>
              )}
              {editingUser?.role === "faculty" && (
                <>
                  <div className="input-group">
                    <label className="input-label">Subject</label>
                    <input className="input-field" value={editFormData.subject || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Department</label>
                    <input className="input-field" value={editFormData.department || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })} />
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveUser}>✓ Save Changes</button>
              <button className="btn btn-outline" onClick={() => setShowEditModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
          MODAL: Classroom Liveness Images
      ═══════════════════════════════════ */}
      {showLivelinessModal && selectedClassroom && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.9)",
          backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "1rem"
        }}>
          <div className="card" style={{ maxWidth: "680px", width: "100%", zIndex: 1001, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="card-header">
              <div>
                <div className="card-title">Liveness Images — {selectedClassroom.name}</div>
                <div className="card-subtitle">Minimum 6 images required for liveness detection</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={handleCloseLivelinessModal}>✕</button>
            </div>

            <div className="input-group">
              <label className="input-label">Upload Reference Images</label>
              <input type="file" accept="image/*" multiple className="input-field"
                onChange={handleClassroomImageUpload} disabled={uploadingImages} />
              <span className="helper-text">
                {classroomImages.length}/6+ images loaded.
                {classroomImages.length < 6 && <span style={{ color: "var(--gold-mid)" }}> Need {6 - classroomImages.length} more.</span>}
              </span>
            </div>

            {classroomImages.length > 0 && (
              <div className="reference-images-grid">
                {classroomImages.map((img, i) => (
                  <div key={i} className="reference-image-item">
                    <img src={img} alt={`Ref ${i + 1}`} />
                    <div className="reference-image-overlay">
                      <span className="image-label">#{i + 1}</span>
                      <button className="btn-remove-reference"
                        onClick={() => handleRemoveClassroomImageItem(i)}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {livelinessError && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "4px", padding: "0.6rem", marginTop: "0.75rem" }}>
                <div className="error-text" style={{ margin: 0 }}>⚠ {livelinessError}</div>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveLiveliness} disabled={uploadingImages}>
                {uploadingImages ? <><Spinner /><span style={{ marginLeft: 8 }}>Saving…</span></> : "✓ Save Images"}
              </button>
              <button className="btn btn-outline" onClick={handleCloseLivelinessModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminDashboard;
