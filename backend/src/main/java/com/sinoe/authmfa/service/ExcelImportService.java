package com.sinoe.authmfa.service;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.FormulaEvaluator;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExcelImportService {
    public String readRows(MultipartFile file, int columns) {
        if (file == null || file.isEmpty() || file.getOriginalFilename() == null
                || !file.getOriginalFilename().toLowerCase().endsWith(".xlsx")) {
            throw new IllegalArgumentException("Selecciona un archivo Excel .xlsx válido.");
        }

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            if (workbook.getNumberOfSheets() == 0) {
                throw new IllegalArgumentException("El archivo Excel no contiene hojas.");
            }
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();
            FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
            List<String> lines = new ArrayList<>();
            for (Row row : sheet) {
                List<String> values = new ArrayList<>();
                boolean hasContent = false;
                for (int i = 0; i < columns; i++) {
                    Cell cell = row.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    String value = cell == null ? "" : formatter.formatCellValue(cell, evaluator).trim();
                    if (value.contains(";") || value.contains("\n") || value.contains("\r")) {
                        throw new IllegalArgumentException("La fila " + (row.getRowNum() + 1)
                                + " contiene punto y coma o saltos de línea.");
                    }
                    hasContent |= !value.isEmpty();
                    values.add(value);
                }
                if (hasContent) {
                    lines.add(String.join(";", values));
                }
            }
            if (lines.isEmpty()) {
                throw new IllegalArgumentException("El archivo Excel está vacío.");
            }
            return String.join("\n", lines);
        } catch (IOException | RuntimeException ex) {
            if (ex instanceof IllegalArgumentException) throw (IllegalArgumentException) ex;
            throw new IllegalArgumentException("No se pudo leer el archivo Excel .xlsx.", ex);
        }
    }
}
