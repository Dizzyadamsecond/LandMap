const HOURS_SOON = 24;
export function computeDueAlerts(store, now = Date.now()) {
    const tasks = store
        .pendingTasks()
        .filter((t) => t.kind === 'follow_up' && t.dueAt);
    const alerts = [];
    for (const t of tasks) {
        const due = new Date(t.dueAt).getTime();
        if (Number.isNaN(due))
            continue;
        const hoursDelta = (due - now) / (3600 * 1000);
        let severity = 'upcoming';
        if (hoursDelta < 0)
            severity = 'overdue';
        else if (hoursDelta <= HOURS_SOON)
            severity = 'due_soon';
        // Only surface overdue + due soon in the alert tray
        if (severity === 'upcoming')
            continue;
        alerts.push({
            id: `due_${t.id}`,
            taskId: t.id,
            title: t.title,
            leadId: t.leadId,
            dealId: t.dealId,
            channel: t.channel,
            agentId: t.agentId,
            dueAt: t.dueAt,
            hoursDelta: Math.round(hoursDelta * 10) / 10,
            severity,
            draft: t.draft,
        });
    }
    return alerts.sort((a, b) => a.hoursDelta - b.hoursDelta);
}
export function dueAlertSummary(alerts) {
    return {
        total: alerts.length,
        overdue: alerts.filter((a) => a.severity === 'overdue').length,
        dueSoon: alerts.filter((a) => a.severity === 'due_soon').length,
    };
}
