package com.linkedagent.airagservice.controller;

import com.linkedagent.airagservice.entity.DocumentChunk;
import com.linkedagent.airagservice.exception.AiServiceException;
import com.linkedagent.airagservice.repository.DocumentChunkRepository;
import com.linkedagent.airagservice.service.AiRagService;
import com.linkedagent.airagservice.service.DocumentParserService;
import com.linkedagent.airagservice.service.EmbeddingService;
import com.linkedagent.airagservice.dto.DocumentStat;
import com.linkedagent.airagservice.dto.DocumentChunkDto;
import com.pgvector.PGvector;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Autowired
    private AiRagService aiRagService;

    @Autowired
    private DocumentParserService documentParserService;

    @Autowired
    private EmbeddingService embeddingService;

    @Autowired
    private DocumentChunkRepository documentChunkRepository;

    @PostMapping("/ask")
    public Map<String, Object> askQuestion(@RequestBody Map<String, String> payload) {
        String query = payload.get("query");
        String sessionId = payload.getOrDefault("sessionId", "anonymous");

        Map<String, Object> result = new HashMap<>();
        try {
            result.put("success", true);
            result.put("answer", aiRagService.generateResponseSync(sessionId, query));
        } catch (AiServiceException e) {
            result.clear();
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    @PostMapping("/doc/upload")
    public ResponseEntity<Map<String, Object>> uploadDocument(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        try {
            // 1. Parse document
            String content = documentParserService.parseDocument(file);
            
            // 2. Chunk text (simple approach: every 500 chars with 100 char overlap)
            List<String> chunks = chunkText(content, 500, 100);
            
            // 3. Process each chunk
            for (String chunk : chunks) {
                if (chunk == null || chunk.trim().isEmpty()) {
                    continue;
                }
                
                // Get embedding
                List<Double> embedding = embeddingService.getEmbedding(chunk);
                float[] floatEmbedding = new float[embedding.size()];
                for (int i = 0; i < embedding.size(); i++) {
                    floatEmbedding[i] = embedding.get(i).floatValue();
                }
                
                // Save to DB
                DocumentChunk documentChunk = new DocumentChunk();
                documentChunk.setDocumentName(file.getOriginalFilename());
                documentChunk.setContent(chunk);
                documentChunk.setEmbedding(new PGvector(floatEmbedding));
                
                documentChunkRepository.save(documentChunk);
            }
            
            response.put("success", true);
            response.put("message", "Document uploaded and processed successfully. Total chunks: " + chunks.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error processing document: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    private List<String> chunkText(String text, int chunkSize, int overlapSize) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isEmpty()) {
            return chunks;
        }
        
        int start = 0;
        while (start < text.length()) {
            int end = Math.min(start + chunkSize, text.length());
            chunks.add(text.substring(start, end));
            
            if (end == text.length()) {
                break;
            }
            start = end - overlapSize;
        }
        return chunks;
    }

    @GetMapping("/doc/list")
    public ResponseEntity<List<DocumentStat>> listDocuments() {
        return ResponseEntity.ok(documentChunkRepository.getDocumentStats());
    }

    @GetMapping("/doc/chunks")
    public ResponseEntity<List<DocumentChunkDto>> getDocumentChunks(@RequestParam("name") String documentName) {
        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentNameOrderByIdAsc(documentName);
        List<DocumentChunkDto> dtos = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            DocumentChunk chunk = chunks.get(i);
            dtos.add(new DocumentChunkDto(chunk.getId(), chunk.getDocumentName(), chunk.getContent(), i));
        }
        return ResponseEntity.ok(dtos);
    }

    @DeleteMapping("/doc")
    public ResponseEntity<Map<String, Object>> deleteDocument(@RequestParam("name") String documentName) {
        documentChunkRepository.deleteByDocumentName(documentName);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}
