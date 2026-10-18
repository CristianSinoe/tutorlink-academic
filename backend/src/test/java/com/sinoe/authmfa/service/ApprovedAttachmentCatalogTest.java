package com.sinoe.authmfa.service;

import com.sinoe.authmfa.config.ApprovedAttachmentCatalog;
import com.sinoe.authmfa.config.ApprovedAttachmentCatalog.Entry;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class ApprovedAttachmentCatalogTest {
    @Test void defaultCatalogIsEmptyAndMatchingIsExactAndInstitutional() {
        assertTrue(new ApprovedAttachmentCatalog(null).find(1,"https://example.edu/file").isEmpty());
        var catalog=new ApprovedAttachmentCatalog(List.of(new Entry(1L,"https://example.edu/file","file.pdf",null,null)));
        assertTrue(catalog.find(1,"https://example.edu/file").isPresent());
        assertTrue(catalog.find(2,"https://example.edu/file").isEmpty());
        assertTrue(catalog.find(1,"https://example.edu/file?token=forged").isEmpty());
    }
    @ParameterizedTest @ValueSource(strings={"http://example.edu/file","https://user:secret@example.edu/file",
            "https://example.edu/file#fragment","https:///no-host","not a url"})
    void rejectsUnsafeConfigurationWithoutEchoingUrl(String url) {
        var ex=assertThrows(IllegalArgumentException.class, () -> new Entry(1L,url,"file.pdf",null,null));
        assertFalse(ex.getMessage().contains(url));
    }
    @Test void rejectsDuplicatesAndInvalidMetadata() {
        var entry=new Entry(1L,"https://example.edu/file","file.pdf",null,null);
        assertThrows(IllegalArgumentException.class, () -> new ApprovedAttachmentCatalog(List.of(entry,entry)));
        assertDoesNotThrow(() -> new ApprovedAttachmentCatalog(List.of(entry,new Entry(2L,entry.url(),entry.fileName(),null,null))));
        assertThrows(IllegalArgumentException.class, () -> new Entry(0L,entry.url(),entry.fileName(),null,null));
        assertThrows(IllegalArgumentException.class, () -> new Entry(1L,entry.url()," ",null,null));
        assertThrows(IllegalArgumentException.class, () -> new Entry(1L,entry.url(),"a".repeat(256),null,null));
        assertThrows(IllegalArgumentException.class, () -> new Entry(1L,entry.url(),"f","x".repeat(151),null));
        assertThrows(IllegalArgumentException.class, () -> new Entry(1L,entry.url(),"f",null,-1L));
        assertThrows(IllegalArgumentException.class, () -> new Entry(1L,"https://example.edu/"+"x".repeat(2000),"f",null,null));
    }

    @Test void configurationBindingFailsAtStartupForUnsafeEntries() {
        var runner=new org.springframework.boot.test.context.runner.ApplicationContextRunner()
                .withUserConfiguration(com.sinoe.authmfa.config.AttachmentConfiguration.class);
        runner.run(context -> assertTrue(context.getBean(ApprovedAttachmentCatalog.class).approvedReferences().isEmpty()));
        runner.withPropertyValues("tutorlink.attachments.approved-references[0].institution-id=1",
                "tutorlink.attachments.approved-references[0].url=http://unsafe.example/file",
                "tutorlink.attachments.approved-references[0].file-name=file.pdf")
                .run(context -> assertNotNull(context.getStartupFailure()));
    }
}
