package com.sinoe.authmfa.service;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ExcelImportServiceTest {
    private final ExcelImportService service = new ExcelImportService();

    @Test
    void readsFirstSheetAndColumnOrder() throws Exception {
        byte[] content;
        try (var workbook = new XSSFWorkbook(); var output = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet("Asignaciones");
            var header = sheet.createRow(0);
            header.createCell(0).setCellValue("tutorCode");
            header.createCell(1).setCellValue("matricula");
            var row = sheet.createRow(1);
            row.createCell(0).setCellValue("TUT001");
            row.createCell(1).setCellValue("S230010");
            workbook.write(output);
            content = output.toByteArray();
        }

        var file = new MockMultipartFile("file", "asignaciones.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", content);
        assertEquals("tutorCode;matricula\nTUT001;S230010", service.readRows(file, 2));
    }

    @Test
    void rejectsOtherFormats() {
        var file = new MockMultipartFile("file", "asignaciones.csv", "text/csv", "a;b".getBytes());
        assertThrows(IllegalArgumentException.class, () -> service.readRows(file, 2));
    }
}
