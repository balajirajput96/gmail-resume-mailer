# Background Automation Decision

The published agent workspace intentionally does **not** start a continuous 24x7 autonomous process. The deployment runs on autoscaling infrastructure, and the current capabilities involve API-backed AI planning, image generation, GitHub public metadata, and potential external coding actions. Continuous polling would spend credits, amplify rate-limit risk, and cannot create missing Google/GitHub OAuth credentials.

User-initiated planning and image jobs are therefore the supported execution model. Each substantive action is durable in the job or asset history and requires an explicit UI interaction. This preserves a clear audit trail and prevents invisible repository, email, deployment, or media activity.

If future requirements justify a scheduled workflow, it must be a narrow, observable task with an explicit cadence, input source, owner notification, and no credential-recovery behavior. Examples could include a daily read-only public repository metadata refresh after a dedicated GitHub OAuth integration is configured. It must not auto-commit, auto-publish, or invoke paid media generation without an approval step.
