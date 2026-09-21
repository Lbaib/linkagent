package com.linkedagent.airagservice.controller;

import com.linkedagent.airagservice.dto.DocumentChunkDto;
import com.linkedagent.airagservice.entity.DocumentChunk;
import com.linkedagent.airagservice.repository.DocumentChunkRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiControllerTest {

    @Mock
    private DocumentChunkRepository documentChunkRepository;

    @InjectMocks
    private AiController aiController;

    @Test
    void getDocumentChunks_whenChunksExist_returnsChunkDtoList() {
        DocumentChunk c1 = new DocumentChunk();
        c1.setId(1L);
        c1.setDocumentName("test.md");
        c1.setContent("Chunk 1 text");

        DocumentChunk c2 = new DocumentChunk();
        c2.setId(2L);
        c2.setDocumentName("test.md");
        c2.setContent("Chunk 2 text");

        when(documentChunkRepository.findByDocumentNameOrderByIdAsc("test.md"))
                .thenReturn(Arrays.asList(c1, c2));

        ResponseEntity<List<DocumentChunkDto>> response = aiController.getDocumentChunks("test.md");

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        List<DocumentChunkDto> body = response.getBody();
        assertNotNull(body);
        assertEquals(2, body.size());

        assertEquals(1L, body.get(0).getId());
        assertEquals("test.md", body.get(0).getDocumentName());
        assertEquals("Chunk 1 text", body.get(0).getContent());
        assertEquals(0, body.get(0).getChunkIndex());

        assertEquals(2L, body.get(1).getId());
        assertEquals(1, body.get(1).getChunkIndex());
    }

    @Test
    void getDocumentChunks_whenNoChunks_returnsEmptyList() {
        when(documentChunkRepository.findByDocumentNameOrderByIdAsc("unknown.md"))
                .thenReturn(Collections.emptyList());

        ResponseEntity<List<DocumentChunkDto>> response = aiController.getDocumentChunks("unknown.md");

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        List<DocumentChunkDto> body = response.getBody();
        assertNotNull(body);
        assertTrue(body.isEmpty());
    }

    @Test
    void deleteDocument_callsRepositoryAndReturnsSuccess() {
        ResponseEntity<Map<String, Object>> response = aiController.deleteDocument("to-delete.md");

        verify(documentChunkRepository).deleteByDocumentName("to-delete.md");
        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue((Boolean) response.getBody().get("success"));
    }
}
