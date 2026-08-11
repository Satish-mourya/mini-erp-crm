import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoicePDF = (challan) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(33, 150, 243); // Primary Blue
  doc.text('Mini ERP', 14, 20);
  
  doc.setFontSize(16);
  doc.setTextColor(50, 50, 50);
  doc.text('TAX INVOICE / CHALLAN', 14, 30);
  
  // Invoice Details (Right Side)
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Challan No: ${challan.challan_number}`, 140, 20);
  doc.text(`Date: ${new Date(challan.created_at).toLocaleDateString()}`, 140, 26);
  doc.text(`Status: ${challan.status}`, 140, 32);

  // Customer Details (Left Side)
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Billed To:', 14, 45);
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(challan.customer.name, 14, 52);
  if (challan.customer.business_name) {
    doc.text(challan.customer.business_name, 14, 58);
  }
  doc.text(`Mobile: ${challan.customer.mobile}`, 14, challan.customer.business_name ? 64 : 58);
  if (challan.customer.gst_number) {
    doc.text(`GST: ${challan.customer.gst_number}`, 14, challan.customer.business_name ? 70 : 64);
  }
  if (challan.customer.address) {
    // Split address into multiple lines if it's long
    const splitAddress = doc.splitTextToSize(challan.customer.address, 80);
    doc.text(splitAddress, 14, challan.customer.business_name ? 76 : 70);
  }

  // Items Table
  const tableColumn = ["S.No.", "Item Description", "SKU", "Qty", "Unit Price", "Total"];
  const tableRows = [];

  let grandTotal = 0;

  challan.items.forEach((item, index) => {
    // Some product data is stored in product_snapshot_data depending on backend logic
    // but the `getChallanById` endpoint includes the real `product` relation too.
    const p = item.product || item.product_snapshot_data || {};
    const unitPrice = parseFloat(p.unit_price) || 0;
    const lineTotal = item.quantity * unitPrice;
    grandTotal += lineTotal;
    
    const row = [
      index + 1,
      p.name || 'Unknown Product',
      p.sku || '-',
      item.quantity,
      `Rs. ${unitPrice.toFixed(2)}`,
      `Rs. ${lineTotal.toFixed(2)}`
    ];
    tableRows.push(row);
  });

  const startY = 90; // Start below customer details
  
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: startY,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [33, 150, 243], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 248, 250] },
    margin: { top: startY }
  });

  // Grand Total
  const finalY = doc.lastAutoTable.finalY || startY + 20;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Grand Total: Rs. ${grandTotal.toFixed(2)}`, 140, finalY + 10);

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('Thank you for your business!', 14, finalY + 30);
  doc.text('This is a computer generated document.', 14, finalY + 36);

  // Save the PDF
  doc.save(`Invoice_${challan.challan_number}.pdf`);
};
