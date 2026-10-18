package com.sinoe.authmfa.dto;

import jakarta.validation.constraints.*;
import java.time.OffsetDateTime;

public final class AttachmentDtos {
    private AttachmentDtos() { }

    public record Create(@NotBlank @Pattern(regexp = "CONTENT|TASK|SUBMISSION") String resourceType,
                         @NotNull @Positive Long resourceId, @Size(max = 200) String title,
                         @NotBlank @Size(max = 255) String fileName,
                         @NotBlank @Pattern(regexp = "https?://.+") @Size(max = 2000) String url,
                         @Size(max = 150) @Pattern(regexp = "[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+") String mimeType,
                         @PositiveOrZero Long sizeBytes, @Null String publicId) { }
    public record Unlink(@Size(max = 500) String reason) { }
    public record View(Long id, String resourceType, Long resourceId, String title, String fileName,
                       String url, String mimeType, Long sizeBytes, String publicId, OffsetDateTime createdAt) { }

    /** Administrative projection: intentionally excludes private content and provider references. */
    public record Metadata(Long id, String resourceType, Long resourceId, String title, String fileName,
                           String mimeType, Long sizeBytes, OffsetDateTime createdAt) { }

    public record ContentReference(Long id, String url) { }
}
