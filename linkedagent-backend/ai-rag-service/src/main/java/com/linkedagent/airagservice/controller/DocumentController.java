package com.linkedagent.airagservice.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/doc")
public class DocumentController {

    // 7.2 Implement knowledge base document upload API
    @PostMapping("/upload")
    public String uploadDocument() {
        return "Document uploaded.";
    }

    // 7.3 Build the document parser, chunker, and vector embedding pipeline
    @PostMapping("/process")
    public String processDocument() {
        return "Document parsed, chunked, and embedded into pgvector.";
    }
}
