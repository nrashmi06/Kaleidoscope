package com.kaleidoscope.backend.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UploadSignatureResponseDTO {
    private List<SignatureDataDTO> signatures;

    public int getCount() {
        return signatures != null ? signatures.size() : 0;
    }
}