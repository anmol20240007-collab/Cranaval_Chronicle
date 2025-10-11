import express from 'express';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import Complaint from '../models/Complaint.js';

const router = express.Router();


router.get('/complaints/csv', async (req, res) => {
  try {
    const complaints = await Complaint.find().lean();
    const fields = ['id', 'name', 'email', 'location', 'urgency', 'description', 'status', 'date', 'update'];
    const parser = new Parser({ fields });
    const csv = parser.parse(complaints);

    res.header('Content-Type', 'text/csv');
    res.attachment('complaints.csv');
    return res.send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ message: 'Error generating CSV file' });
  }
});



router.get('/complaints/pdf',  async (req, res) => {
  try {
    const complaints = await Complaint.find().lean();

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=complaints.pdf');
    doc.pipe(res);

    doc.fontSize(18).text('Complaints Report', { align: 'center' });
    doc.moveDown();

    complaints.forEach((c, i) => {
      doc.fontSize(12).text(`${i + 1}. ${c.name} (${c.email})`);
      doc.text(`Location: ${c.location}`);
      doc.text(`Urgency: ${c.urgency || 'N/A'}`);
      doc.text(`Status: ${c.status}`);
      doc.text(`Description: ${c.description}`);
      doc.text(`Date: ${new Date(c.date).toLocaleString()}`);
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ message: 'Error generating PDF file' });
  }
});

export default router;
