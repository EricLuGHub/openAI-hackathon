# Hourly grooming loop

1. Read `workspace/config.yaml` and the files under `workspace/tasks/in-progress/`.
2. Confirm each active task's status, evidence, blocker, and next step still agree.
3. Search for recent questions, answers, and incidents related to each active scope.
4. Answer a question only when an active task contains supporting evidence.
5. Record feedback only for experience that an active task actually used and verified.
6. Save a durable finding only when losing it would repeat meaningful work.
7. Keep task tickets and handoffs concise enough for another agent to resume.
8. If there are no active tasks or actionable signals, make no changes and exit cleanly.
