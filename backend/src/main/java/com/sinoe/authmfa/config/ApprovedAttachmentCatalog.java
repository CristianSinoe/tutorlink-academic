package com.sinoe.authmfa.config;

import java.net.URI;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Operator-reviewed public references. No requests to the external hosts are made. */
@ConfigurationProperties(prefix = "tutorlink.attachments")
public record ApprovedAttachmentCatalog(List<Entry> approvedReferences) {
    public ApprovedAttachmentCatalog {
        approvedReferences = approvedReferences == null ? List.of() : List.copyOf(approvedReferences);
        var keys = new HashSet<String>();
        for (Entry entry : approvedReferences) {
            if (!keys.add(entry.institutionId() + "\n" + entry.url())) {
                throw new IllegalArgumentException("Referencia duplicada en el catálogo de adjuntos");
            }
        }
    }

    public record Entry(Long institutionId, String url, String fileName, String mimeType, Long sizeBytes) {
        public Entry {
            if (institutionId == null || institutionId <= 0 || url == null || url.length() > 2000
                    || fileName == null || fileName.isBlank() || fileName.length() > 255
                    || (mimeType != null && (mimeType.length() > 150
                        || !mimeType.matches("[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+")))
                    || (sizeBytes != null && sizeBytes < 0)) {
                throw invalid();
            }
            URI uri;
            try { uri = URI.create(url); } catch (IllegalArgumentException ex) { throw invalid(); }
            if (!"https".equals(uri.getScheme()) || uri.getHost() == null || uri.getRawUserInfo() != null
                    || uri.getRawFragment() != null) throw invalid();
        }
        private static IllegalArgumentException invalid() {
            // Never include configured URLs or credentials in errors.
            return new IllegalArgumentException("Entrada inválida en el catálogo de adjuntos");
        }
    }

    public Optional<Entry> find(long institutionId, String url) {
        return approvedReferences.stream().filter(e -> e.institutionId() == institutionId && e.url().equals(url)).findFirst();
    }
}
