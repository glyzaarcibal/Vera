import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axios.instance";
import { useSelector, useDispatch } from "react-redux";
import { updateTokens } from "../../store/slices/authSlice";
import { selectUser } from "../../store/slices/authSelectors";
import { 
  Pill, Clock, Calendar, Star, Download, Plus, Trash2, 
  Heart, History, MessageSquare, CheckCircle, ArrowLeft, X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ModalPortal from "../../components/ModalPortal";
import TokenRewardModal from "../../components/TokenRewardModal";
import ReusableModal from "../../components/ReusableModal";
import "./MedicationTracker.css";

const MedicationTracker = () => {
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const userId = user?.id;
    const dispatch = useDispatch();

    const [medicationName, setMedicationName] = useState("");
    const [dosage, setDosage] = useState("");
    const [frequency, setFrequency] = useState("Once daily");
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [notes, setNotes] = useState("");
    const [category, setCategory] = useState("Psychiatric Medication");
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [reason, setReason] = useState("Course Complete");
    const [efficacy, setEfficacy] = useState(3);
    const [showLogModal, setShowLogModal] = useState(false);
    const [showAllMaintenance, setShowAllMaintenance] = useState(false);
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        if (userId) {
            loadHistory();
        }
    }, [userId]);

    const loadHistory = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get("/activities");
            const activities = response.data.activities || [];
            const medHistory = activities
                .filter((act) => act.activity_type === "medication")
                .map((act) => ({
                    id: act.id,
                    ...act.data,
                    timestamp: act.created_at || act.data.timestamp
                }))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setHistory(medHistory);
        } catch (error) {
            console.error("Failed to load medication history", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!medicationName.trim()) return;

        const newEntry = {
            name: medicationName,
            dosage,
            frequency,
            isMaintenance,
            notes,
            category,
            startedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            timestamp: new Date().toISOString(),
            status: isMaintenance ? "Taken" : "Completed",
            reason: isMaintenance ? null : reason,
            efficacy: isMaintenance ? null : efficacy
        };

        try {
            setIsLoading(true);
            const res = await axiosInstance.post("/activities/save", {
                activityType: "medication",
                data: newEntry,
            });

            if (res.data?.updatedTokens !== null) {
                dispatch(updateTokens(res.data.updatedTokens));
                setShowRewardModal(true);
            }

            setMedicationName("");
            setDosage("");
            setFrequency("Once daily");
            setIsMaintenance(false);
            setNotes("");
            setShowLogModal(false);
            setReason("Course Complete");
            setEfficacy(3);
            loadHistory();
        } catch (error) {
            console.error("Failed to save medication", error);
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = (id) => {
        setHistory(history.filter(item => item.id !== id));
        setConfirmDeleteId(null);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const timestamp = new Date().toLocaleString();

        // Title & Header
        doc.setFontSize(22);
        doc.setTextColor(124, 58, 237); // Purple theme
        doc.text("V.E.R.A. Medication Report", 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Patient: ${user?.username || user?.email}`, 14, 30);
        doc.text(`Generated on: ${timestamp}`, 14, 35);
        doc.setLineWidth(0.5);
        doc.setDrawColor(241, 245, 249);
        doc.line(14, 40, 196, 40);

        // Maintenance Section
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text("Current Maintenance Medications", 14, 50);

        const maintenanceData = maintenance.map(m => [
            m.name,
            m.dosage,
            m.frequency,
            m.category || "General",
            m.startedDate || "N/A"
        ]);

        autoTable(doc, {
            startY: 55,
            head: [['Medication', 'Dosage', 'Frequency', 'Category', 'Started']],
            body: maintenanceData.length > 0 ? maintenanceData : [['No active maintenance medications', '', '', '', '']],
            headStyles: { fillStyle: 'fill', fillColor: [124, 58, 237], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [250, 250, 255] },
            margin: { left: 14, right: 14 }
        });

        // Historical Records Section
        const finalY = doc.lastAutoTable.finalY || 100;
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text("Historical Records", 14, finalY + 15);

        const historicalData = pastRecords.map(m => [
            m.name,
            m.dosage,
            m.frequency || "N/A",
            m.reason || "Course Complete",
            `${m.efficacy || 3}/5 Stars`
        ]);

        autoTable(doc, {
            startY: finalY + 20,
            head: [['Medication', 'Dosage', 'Frequency', 'Reason for Stopping', 'Efficacy']],
            body: historicalData.length > 0 ? historicalData : [['No historical records found', '', '', '', '']],
            headStyles: { fillStyle: 'fill', fillColor: [100, 116, 139], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Page ${i} of ${pageCount} - V.E.R.A. Digital Sanctuary`, 105, 285, { align: "center" });
        }

        doc.save(`VERA_Medication_Report_${user?.username || 'User'}.pdf`);
    };

    const maintenance = history.filter(item => item.isMaintenance);
    const pastRecords = history.filter(item => !item.isMaintenance);

    return (
        <div className="med-container">
            <div className="med-content">
                
                {/* ── HEADER ── */}
                <header className="med-header">
                    <div className="review-badge">
                        <CheckCircle size={14} />
                        PSYCHIATRIST REVIEW: SYNCHRONIZED
                        <span className="last-update">Last update: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>

                    <div className="med-title-row">
                        <div>
                            <h1>Medication <span className="text-purple">History</span></h1>
                            <p className="med-subtitle">
                                A comprehensive narrative of your therapeutic journey, maintained for 
                                clinical precision and personal clarity.
                            </p>
                        </div>
                        <div className="med-actions">
                            <button className="btn-export" onClick={handleExportPDF}>
                                <Download size={18} /> Export PDF
                            </button>
                            <button className="btn-log" onClick={() => setShowLogModal(true)}>
                                <Plus size={18} /> Log New Medication
                            </button>
                        </div>
                    </div>
                </header>

                {/* ── CURRENT MAINTENANCE ── */}
                <section className="med-section">
                    <div className="section-title">
                        <div className="section-icon"><Heart size={18} /></div>
                        Current Maintenance
                    </div>
                    <div className="maintenance-grid">
                        {(showAllMaintenance ? maintenance : maintenance.slice(0, 3)).map((med) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={med.id} 
                                className="med-card"
                            >
                                <div className="card-header">
                                    <div className="med-info">
                                        <h3>{med.name}</h3>
                                        <div className="med-category">{med.category || "General"}</div>
                                    </div>
                                    <div className="card-icon"><Pill size={20} /></div>
                                </div>
                                <div className="card-details">
                                    <div className="detail-item">
                                        <label>Dosage</label>
                                        <p>{med.dosage || "Not specified"}</p>
                                    </div>
                                    <div className="detail-item">
                                        <label>Started</label>
                                        <p>{med.startedDate || "Recently"}</p>
                                    </div>
                                </div>
                                <div className="card-footer">
                                    <div className="status-dot" />
                                    <span>Optimal Efficacy Reported</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    {maintenance.length > 3 && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                            <button 
                                className="btn-view-all" 
                                onClick={() => setShowAllMaintenance(!showAllMaintenance)}
                                style={{
                                    background: 'rgba(124, 58, 237, 0.05)',
                                    color: '#7c3aed',
                                    border: '1px solid rgba(124, 58, 237, 0.2)',
                                    padding: '8px 20px',
                                    borderRadius: '100px',
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {showAllMaintenance ? "Show Less" : `See All History (${maintenance.length})`}
                            </button>
                        </div>
                    )}
                </section>

                {/* ── HISTORICAL RECORDS ── */}
                <section className="med-section">
                    <div className="section-title">
                        <div className="section-icon"><History size={18} /></div>
                        Historical Records
                    </div>
                    <div className="table-container">
                        <table className="med-table">
                            <thead>
                                <tr>
                                    <th>Medication</th>
                                    <th>Frequency</th>
                                    <th>Reason for Stopping</th>
                                    <th>Efficacy</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pastRecords.length > 0 ? pastRecords.map((med) => (
                                    <tr key={med.id}>
                                        <td>
                                            <div className="name-cell">
                                                <h4>{med.name}</h4>
                                                <p>{med.dosage}</p>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="period-cell">{med.frequency || "N/A"}</div>
                                        </td>
                                        <td>
                                            <span className={`reason-badge ${med.reason === 'Side Effects' ? 'reason-side-effects' : 'reason-complete'}`}>
                                                {med.reason || "Course Complete"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="efficacy-stars">
                                                {[...Array(med.efficacy || 3)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                                            </div>
                                        </td>
                                        <td>
                                            <button 
                                                onClick={() => setConfirmDeleteId(med.id)}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '40px' }}>
                                            No historical records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* ── LOG ENTRY MODAL ── */}
                <AnimatePresence>
                    {showLogModal && (
                        <ModalPortal>
                            <motion.div 
                                className="med-modal-overlay"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowLogModal(false)}
                            >
                                <motion.div 
                                    className="med-modal-content"
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="modal-header">
                                        <h2>Log Medication Entry</h2>
                                        <button className="modal-close" onClick={() => setShowLogModal(false)}><X /></button>
                                    </div>
                                    <form onSubmit={handleSave}>
                                        <div className="form-grid">
                                            <div className="form-left">
                                                <div className="input-group">
                                                    <label>Medication Name</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="e.g. Sertraline" 
                                                        value={medicationName}
                                                        onChange={(e) => setMedicationName(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="input-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                    <div>
                                                        <label>Dosage</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="e.g. 50mg" 
                                                            value={dosage}
                                                            onChange={(e) => setDosage(e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label>Frequency</label>
                                                        <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                                                            <option>Once daily</option>
                                                            <option>Twice daily</option>
                                                            <option>Three times daily</option>
                                                            <option>As needed (PRN)</option>
                                                            <option>At bedtime</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                 <div className="input-group">
                                                    <label className="checkbox-group">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isMaintenance}
                                                            onChange={(e) => setIsMaintenance(e.target.checked)}
                                                        />
                                                        Mark as Current Maintenance
                                                    </label>
                                                </div>

                                                {!isMaintenance && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="historical-fields"
                                                        style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}
                                                    >
                                                        <div className="input-group" style={{ marginBottom: '20px' }}>
                                                            <label>Reason for Stopping</label>
                                                            <select value={reason} onChange={(e) => setReason(e.target.value)}>
                                                                <option>Course Complete</option>
                                                                <option>Side Effects</option>
                                                                <option>Lack of Efficacy</option>
                                                                <option>Financial Reasons</option>
                                                                <option>Psychiatrist Advice</option>
                                                                <option>Switched Medication</option>
                                                            </select>
                                                        </div>
                                                        <div className="input-group">
                                                            <label>Treatment Efficacy (1-5 Stars)</label>
                                                            <div className="efficacy-selector" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <Star 
                                                                        key={star}
                                                                        size={24}
                                                                        onClick={() => setEfficacy(star)}
                                                                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                                                        fill={star <= efficacy ? "#7c3aed" : "none"}
                                                                        stroke={star <= efficacy ? "#7c3aed" : "#cbd5e1"}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                            <div className="form-right">
                                                <div className="input-group">
                                                    <label>Notes for your psychiatrist</label>
                                                    <textarea 
                                                        rows="6" 
                                                        placeholder="Share specific observations with Dr. Thorne..."
                                                        value={notes}
                                                        onChange={(e) => setNotes(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <button className="btn-submit" type="submit" disabled={isLoading || !medicationName}>
                                            {isLoading ? "Saving..." : "Save to History"}
                                        </button>
                                    </form>
                                </motion.div>
                            </motion.div>
                        </ModalPortal>
                    )}
                </AnimatePresence>

                <ReusableModal
                    isOpen={!!confirmDeleteId}
                    onClose={() => setConfirmDeleteId(null)}
                    title="Delete Entry"
                    type="error"
                >
                    <p className="text-slate-500 text-[16px] leading-relaxed font-medium mb-10">
                        Are you sure you want to delete this medication entry?
                    </p>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setConfirmDeleteId(null)}
                            className="flex-1 py-4 rounded-[1rem] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => confirmDelete(confirmDeleteId)}
                            className="flex-1 py-4 rounded-[1rem] font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </ReusableModal>

            </div>
            <TokenRewardModal 
                isOpen={showRewardModal} 
                onClose={() => setShowRewardModal(false)}
                amount={5}
                message="Your health record has been updated. Staying consistent with your medication is a vital part of your well-being."
            />
        </div>
    );
};

export default MedicationTracker;
