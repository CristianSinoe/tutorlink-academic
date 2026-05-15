package com.sinoe.authmfa.dto.common;

import java.util.List;

// Envoltorio genérico para paginación
public record PagedResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages) {
}