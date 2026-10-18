package com.sinoe.authmfa.service;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class InstitutionCsvParserTest {
    @Test void handlesBomQuotesDelimitersAndEmbeddedLines() {
        var rows=InstitutionImportService.parse("\uFEFFname;email\r\n\"Persona; \"\"Una\"\"\";personal@gmail.com\r\n\"Otra\nPersona\";other@school.edu");
        assertEquals(3,rows.size());assertEquals("Persona; \"Una\"",rows.get(1).get(0));assertEquals("Otra\nPersona",rows.get(2).get(0));
    }
    @Test void rejectsMalformedAndOversizedFiles() {
        assertThrows(IllegalArgumentException.class,() -> InstitutionImportService.parse("\"unclosed"));
        assertThrows(IllegalArgumentException.class,() -> InstitutionImportService.parse("\"closed\"unexpected,other"));
        assertThrows(IllegalArgumentException.class,() -> InstitutionImportService.parse("x".repeat(1000001)));
    }
}
