package com.medicore.billing.service;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import com.medicore.billing.dto.BillingDtos.InvoiceResponse;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
public class PdfInvoiceService {
    
    public byte[] generateInvoicePdf(InvoiceResponse invoice) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();
            
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24);
            Paragraph title = new Paragraph("MEDICORE HOSPITAL", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            
            document.add(new Paragraph(" "));
            
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph header = new Paragraph("INVOICE", headerFont);
            header.setAlignment(Element.ALIGN_CENTER);
            document.add(header);
            
            document.add(new Paragraph(" "));
            
            Font regularFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
            document.add(new Paragraph("Invoice ID: " + invoice.getId(), regularFont));
            document.add(new Paragraph("Patient ID: " + invoice.getPatientId(), regularFont));
            document.add(new Paragraph("Appointment ID: " + invoice.getAppointmentId(), regularFont));
            document.add(new Paragraph("Amount: $" + invoice.getAmount(), regularFont));
            document.add(new Paragraph("Status: " + invoice.getStatus().name(), regularFont));
            document.add(new Paragraph("Issued At: " + invoice.getIssuedAt(), regularFont));
            document.add(new Paragraph("Due Date: " + invoice.getDueDate(), regularFont));
            
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Terms & Conditions: Please pay the total amount by the due date.", regularFont));
            
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF", e);
        }
    }
}
