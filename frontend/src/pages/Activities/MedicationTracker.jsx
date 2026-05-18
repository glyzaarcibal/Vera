import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axios.instance";
import { useSelector, useDispatch } from "react-redux";
import { updateTokens } from "../../store/slices/authSlice";
import { selectUser } from "../../store/slices/authSelectors";
import { 
  Heart, History, MessageSquare, CheckCircle, ArrowLeft, X, Download, Plus, Pill, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ModalPortal from "../../components/ModalPortal";
import TokenRewardModal from "../../components/TokenRewardModal";
import ReusableModal from "../../components/ReusableModal";
import { useLanguage } from "../../context/LanguageContext";
import "./MedicationTracker.css";

const MedicationTracker = () => {
    const { t, language } = useLanguage();
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
    const [startedDate, setStartedDate] = useState("");

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
            startedDate: startedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
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
            setFrequency(language === 'tl' ? "Minsan araw-araw" : "Once daily");
            setIsMaintenance(false);
            setNotes("");
            setShowLogModal(false);
            setStartedDate("");
            setReason(language === 'tl' ? "Tapos na ang Kurso" : "Course Complete");
            setEfficacy(3);
            loadHistory();
        } catch (error) {
            console.error("Failed to save medication", error);
        } finally {
            setIsLoading(false);
        }
    };



    const handleExportPDF = () => {
        const doc = new jsPDF();
        const timestamp = new Date().toLocaleString();

        // Title & Header
        doc.setFontSize(22);
        doc.setTextColor(124, 58, 237); // Purple theme
        doc.text(language === 'tl' ? "Ulat ng Gamot sa V.E.R.A." : "V.E.R.A. Medication Report", 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`${language === 'tl' ? 'Pasyente' : 'Patient'}: ${user?.username || user?.email}`, 14, 30);
        doc.text(`${language === 'tl' ? 'Ginawa noong' : 'Generated on'}: ${timestamp}`, 14, 35);
        doc.setLineWidth(0.5);
        doc.setDrawColor(241, 245, 249);
        doc.line(14, 40, 196, 40);

        // Maintenance Section
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text(language === 'tl' ? "Mga Kasalukuyang Maintenance na Gamot" : "Current Maintenance Medications", 14, 50);

        const maintenanceData = maintenance.map(m => [
            m.name,
            m.dosage,
            m.frequency,
            m.category || (language === 'tl' ? "Pangkalahatan" : "General"),
            m.startedDate || "N/A"
        ]);

        autoTable(doc, {
            startY: 55,
            head: [[
              language === 'tl' ? 'Gamot' : 'Medication', 
              language === 'tl' ? 'Dosis' : 'Dosage', 
              language === 'tl' ? 'Dalas' : 'Frequency', 
              language === 'tl' ? 'Kategorya' : 'Category', 
              language === 'tl' ? 'Nagsimula' : 'Started'
            ]],
            body: maintenanceData.length > 0 ? maintenanceData : [[language === 'tl' ? 'Walang aktibong maintenance na gamot' : 'No active maintenance medications', '', '', '', '']],
            headStyles: { fillStyle: 'fill', fillColor: [124, 58, 237], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [250, 250, 255] },
            margin: { left: 14, right: 14 }
        });

        // Historical Records Section
        const finalY = doc.lastAutoTable.finalY || 100;
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text(language === 'tl' ? "Mga Nakaraang Record" : "Historical Records", 14, finalY + 15);

        const historicalData = pastRecords.map(m => [
            m.name,
            m.dosage,
            m.frequency || "N/A",
            m.reason || (language === 'tl' ? "Tapos na ang Kurso" : "Course Complete"),
            `${m.efficacy || 3}/5 ${language === 'tl' ? 'Bituin' : 'Stars'}`
        ]);

        autoTable(doc, {
            startY: finalY + 20,
            head: [[
              language === 'tl' ? 'Gamot' : 'Medication', 
              language === 'tl' ? 'Dosis' : 'Dosage', 
              language === 'tl' ? 'Dalas' : 'Frequency', 
              language === 'tl' ? 'Dahilan ng Paghinto' : 'Reason for Stopping', 
              language === 'tl' ? 'Bisa' : 'Efficacy'
            ]],
            body: historicalData.length > 0 ? historicalData : [[language === 'tl' ? 'Walang nakitang mga nakaraang record' : 'No historical records found', '', '', '', '']],
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
            doc.text(`${language === 'tl' ? 'Pahina' : 'Page'} ${i} of ${pageCount} - V.E.R.A. Digital Sanctuary`, 105, 285, { align: "center" });
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
                        {t('med_sync')}
                        <span className="last-update">{t('med_last_update')}: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>

                    <div className="med-title-row">
                        <div>
                            <h1>{t('med_title').split('{History}')[0]}<span className="text-purple">{language === 'tl' ? 'Kasaysayan' : 'History'}</span>{t('med_title').split('{History}')[1]}</h1>
                            <p className="med-subtitle">
                                {t('med_subtitle')}
                            </p>
                        </div>
                        <div className="med-actions">
                            <button className="btn-export" onClick={handleExportPDF}>
                                <Download size={18} /> {t('med_export_pdf')}
                            </button>
                            <button className="btn-log" onClick={() => { setMedicationName(""); setDosage(""); setNotes(""); setStartedDate(""); setShowLogModal(true); }}>
                                <Plus size={18} /> {t('med_log_new')}
                            </button>
                        </div>
                    </div>
                </header>

                {/* ── CURRENT MAINTENANCE ── */}
                <section className="med-section">
                    <div className="section-title">
                        <div className="section-icon"><Heart size={18} /></div>
                        {t('med_current_maintenance')}
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
                                        <div className="med-category">{med.category || (language === 'tl' ? "Pangkalahatan" : "General")}</div>
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
                                    <span>{t('med_optimal_efficacy')}</span>
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
                                {showAllMaintenance ? (language === 'tl' ? "Ipakita ang Mas Kaunti" : "Show Less") : `${language === 'tl' ? 'Tingnan ang Lahat ng Kasaysayan' : 'See All History'} (${maintenance.length})`}
                            </button>
                        </div>
                    )}
                </section>

                {/* ── HISTORICAL RECORDS ── */}
                <section className="med-section">
                    <div className="section-title">
                        <div className="section-icon"><History size={18} /></div>
                        {t('med_historical_records')}
                    </div>
                    <div className="table-container">
                        <table className="med-table">
                            <thead>
                                <tr>
                                    <th>{language === 'tl' ? 'Gamot' : 'Medication'}</th>
                                    <th>{t('med_freq_label')}</th>
                                    <th>{t('med_reason_stopping')}</th>
                                    <th>{t('med_efficacy')}</th>
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
                                                {med.reason || (language === 'tl' ? "Tapos na ang Kurso" : "Course Complete")}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="efficacy-stars">
                                                {[...Array(med.efficacy || 3)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '40px' }}>
                                            {t('med_no_records')}
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
                                        <h2>{t('med_modal_title')}</h2>
                                        <button className="modal-close" onClick={() => setShowLogModal(false)}><X /></button>
                                    </div>
                                    <form onSubmit={handleSave}>
                                        <div className="form-grid">
                                            <div className="form-left">
                                                <div className="input-group">
                                                    <label>{t('med_name_label')}</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder={language === 'tl' ? "hal. Sertraline" : "e.g. Sertraline"} 
                                                        value={medicationName}
                                                        onChange={(e) => setMedicationName(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="input-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                    <div>
                                                        <label>{t('med_dosage_label')}</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder={language === 'tl' ? "hal. 50mg" : "e.g. 50mg"} 
                                                            value={dosage}
                                                            onChange={(e) => setDosage(e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label>{t('med_freq_label')}</label>
                                                        <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                                                            <option>{language === 'tl' ? "Minsan araw-araw" : "Once daily"}</option>
                                                            <option>{language === 'tl' ? "Dalawang beses araw-araw" : "Twice daily"}</option>
                                                            <option>{language === 'tl' ? "Tatlong beses araw-araw" : "Three times daily"}</option>
                                                            <option>{language === 'tl' ? "Kung kinakailangan (PRN)" : "As needed (PRN)"}</option>
                                                            <option>{language === 'tl' ? "Bago matulog" : "At bedtime"}</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="input-group">
                                                    <label>{language === 'tl' ? "Petsa ng Pagsisimula" : "Started Date"}</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder={language === 'tl' ? "hal. May 13, 2026" : "e.g. May 13, 2026"} 
                                                        value={startedDate}
                                                        onChange={(e) => setStartedDate(e.target.value)}
                                                    />
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
                                                            <label>{t('med_reason_stopping')}</label>
                                                            <select value={reason} onChange={(e) => setReason(e.target.value)}>
                                                                <option>{language === 'tl' ? "Tapos na ang Kurso" : "Course Complete"}</option>
                                                                <option>{language === 'tl' ? "Side Effects" : "Side Effects"}</option>
                                                                <option>{language === 'tl' ? "Kakulangan ng Bisa" : "Lack of Efficacy"}</option>
                                                                <option>{language === 'tl' ? "Pinansyal na Dahilan" : "Financial Reasons"}</option>
                                                                <option>{language === 'tl' ? "Payo ng Psychiatrist" : "Psychiatrist Advice"}</option>
                                                                <option>{language === 'tl' ? "Nagpalit ng Gamot" : "Switched Medication"}</option>
                                                            </select>
                                                        </div>
                                                        <div className="input-group">
                                                            <label>{t('med_efficacy')} (1-5 {language === 'tl' ? 'Bituin' : 'Stars'})</label>
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
                                            {isLoading ? (language === 'tl' ? "Inililigtas..." : "Saving...") : t('med_save_btn')}
                                        </button>
                                    </form>
                                </motion.div>
                            </motion.div>
                        </ModalPortal>
                    )}
                </AnimatePresence>



            </div>
            <TokenRewardModal 
                isOpen={showRewardModal} 
                onClose={() => setShowRewardModal(false)}
                amount={5}
                message={t('med_reward')}
            />
        </div>
    );
};

export default MedicationTracker;
