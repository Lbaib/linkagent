package com.linkedagent.airagservice.service;

import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.sax.BodyContentHandler;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

@Service
public class DocumentParserService {

    public String parseDocument(MultipartFile file) throws Exception {
        AutoDetectParser parser = new AutoDetectParser();
        BodyContentHandler handler = new BodyContentHandler(-1); // -1 to disable write limit
        Metadata metadata = new Metadata();
        try (InputStream stream = file.getInputStream()) {
            parser.parse(stream, handler, metadata, new ParseContext());
            return handler.toString();
        }
    }
}
