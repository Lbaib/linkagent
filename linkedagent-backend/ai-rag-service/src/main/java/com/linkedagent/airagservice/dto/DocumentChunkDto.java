package com.linkedagent.airagservice.dto;

public class DocumentChunkDto {
    private Long id;
    private String documentName;
    private String content;
    private Integer chunkIndex;

    public DocumentChunkDto() {
    }

    public DocumentChunkDto(Long id, String documentName, String content, Integer chunkIndex) {
        this.id = id;
        this.documentName = documentName;
        this.content = content;
        this.chunkIndex = chunkIndex;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDocumentName() {
        return documentName;
    }

    public void setDocumentName(String documentName) {
        this.documentName = documentName;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Integer getChunkIndex() {
        return chunkIndex;
    }

    public void setChunkIndex(Integer chunkIndex) {
        this.chunkIndex = chunkIndex;
    }
}
