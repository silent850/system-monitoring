import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { UptimeLog, CrawledLink } from '../types';

interface ReportConfig {
  systemName: string;
  companyName: string;
  logoUrl?: string;
  reportTitle: string;
}

export const generateUptimePDF = (logs: UptimeLog[], config: ReportConfig) => {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString();

  // Header
  doc.setFontSize(20);
  doc.text(config.reportTitle, 14, 22);
  doc.setFontSize(10);
  doc.text(`System: ${config.systemName}`, 14, 30);
  doc.text(`Company: ${config.companyName}`, 14, 35);
  doc.text(`Generated: ${dateStr}`, 14, 40);

  // Table
  const tableData = logs.map(l => [
    l.url,
    l.status.toUpperCase(),
    l.responseTime ? `${l.responseTime}ms` : '-',
    new Date(l.timestamp).toLocaleString()
  ]);

  (doc as any).autoTable({
    startY: 45,
    head: [['URL', 'Status', 'Response Time', 'Timestamp']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] } // Indigo-500
  });

  doc.save(`${config.reportTitle.replace(/\s+/g, '_')}_${dateStr}.pdf`);
};

export const generateCrawlerPDF = (links: CrawledLink[], config: ReportConfig) => {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString();

  // Header
  doc.setFontSize(20);
  doc.text(config.reportTitle, 14, 22);
  doc.setFontSize(10);
  doc.text(`System: ${config.systemName}`, 14, 30);
  doc.text(`Company: ${config.companyName}`, 14, 35);
  doc.text(`Generated: ${dateStr}`, 14, 40);

  // Table
  const tableData = links.map(l => [
    l.href.substring(0, 50) + (l.href.length > 50 ? '...' : ''),
    l.lastStatus.toUpperCase(),
    l.depth.toString(),
    l.isBlocked ? 'Yes' : 'No'
  ]);

  (doc as any).autoTable({
    startY: 45,
    head: [['Link', 'Status', 'Depth', 'Blocked']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] } // Indigo-500
  });

  doc.save(`${config.reportTitle.replace(/\s+/g, '_')}_${dateStr}.pdf`);
};
