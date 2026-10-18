package com.sinoe.authmfa.demo;

import java.util.Optional;
import java.util.concurrent.ConcurrentLinkedDeque;

/** Process-local fake mail sink for the isolated demo profile. It has no HTTP surface. */
public final class DemoMailbox {
    private final ConcurrentLinkedDeque<Message> messages = new ConcurrentLinkedDeque<>();
    public void add(String recipient, String subject, String body) { messages.addFirst(new Message(recipient, subject, body)); }
    public Optional<Message> latestFor(String recipient) { return messages.stream().filter(m -> m.recipient().equalsIgnoreCase(recipient)).findFirst(); }
    boolean containsCode(String recipient, String code) {
        return latestFor(recipient).map(message -> message.body().contains(code)).orElse(false);
    }
    public void clear() { messages.clear(); }
    public record Message(String recipient, String subject, String body) { }
}
