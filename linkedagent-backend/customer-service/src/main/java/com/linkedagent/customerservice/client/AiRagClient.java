package com.linkedagent.customerservice.client;

import java.util.Map;

public interface AiRagClient {

    Map<String, Object> ask(Map<String, String> body);
}

