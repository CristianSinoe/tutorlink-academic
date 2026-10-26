package com.sinoe.authmfa.dto;

public final class PublicInstitutionDtos {
    private PublicInstitutionDtos() { }
    public record InstitutionView(String code, String name) { }
}
