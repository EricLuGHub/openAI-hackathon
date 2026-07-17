# Security, Privacy, and Trust

## 17. Security, privacy, and trust

### 17.1 Threats

- secrets captured from source or session output;
- cross-tenant data leakage;
- context derived from private channels exposed to unauthorized users;
- prompt injection stored as durable memory;
- incorrect agent finding treated as fact;
- obsolete guidance causing damaging edits;
- malicious developer poisoning shared context;
- source deletion not propagating;
- overly broad session telemetry;
- model provider receiving data outside organizational policy.

### 17.2 Initial controls

- strict organization and space scoping in every query;
- source-derived ACL filtering;
- encryption in transit and at rest;
- secret scanning before publication;
- configurable excluded paths/channels;
- immutable provenance;
- visible trust and lifecycle states;
- no silent replacement of contradictory facts;
- audit log for context creation, access, edits, and deletion;
- minimum evidence requirement for automatically shared findings;
- safe default: no raw chain-of-thought collection;
- retention and deletion propagation.

### 17.3 Prompt-injection handling

Imported text is untrusted data. The extraction pipeline should:

- treat source content as material to analyze, not instructions to follow;
- separate system extraction instructions from source text;
- label source-derived instructions by authority and scope;
- refuse to convert arbitrary external instructions into organization policy;
- scan candidate records for suspicious agent-directed content;
- require stronger evidence or review for executable procedures and security-sensitive instructions.

### 17.4 Data minimization

- retrieve claims rather than full conversations by default;
- upload only authorized session artifacts;
- avoid storing private model reasoning;
- redact secrets before model processing where possible;
- permit customer-controlled retention;
- avoid duplicating raw data when a secure reference is sufficient.

### 17.5 Permission semantics — Open

Questions requiring design:

- Should derived facts inherit the strictest source ACL?
- Can a team-visible fact cite evidence that only some users may inspect?
- How are users removed from a source reflected in cached context?
- Can organization admins override source permissions?
- How are external contractors isolated?

---
