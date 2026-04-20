//
//  EuricioNextCallWidget.swift
//  Euricio
//
//  Reads widget snapshot JSON from App Group user defaults
//  (suite `group.com.euricio.crm.widget`, key `euricio_widget_snapshot`)
//  and renders a SwiftUI widget showing the next call, open tasks
//  count and busy/focus state.
//
//  Brand: Waldgrün #1B5E3F (background), #2A8F5F (accent).
//

import WidgetKit
import SwiftUI

// MARK: - Shared Storage

private let appGroupID = "group.com.euricio.crm.widget"
private let storageKey = "euricio_widget_snapshot"

// MARK: - Data Model

struct WidgetSnapshotPayload: Decodable {
    struct NextCall: Decodable {
        let when: String
        let title: String?
        let entityName: String?
        let entityType: String?
        let entityId: String?

        enum CodingKeys: String, CodingKey {
            case when
            case title
            case entityName = "entity_name"
            case entityType = "entity_type"
            case entityId = "entity_id"
        }
    }

    let isBusy: Bool
    let busyUntil: String?
    let nextCall: NextCall?
    let openTasksCount: Int
    let openCallbacksCount: Int
    let generatedAt: String?

    enum CodingKeys: String, CodingKey {
        case isBusy = "is_busy"
        case busyUntil = "busy_until"
        case nextCall = "next_call"
        case openTasksCount = "open_tasks_count"
        case openCallbacksCount = "open_callbacks_count"
        case generatedAt = "generated_at"
    }
}

private func loadSnapshot() -> WidgetSnapshotPayload? {
    guard
        let defaults = UserDefaults(suiteName: appGroupID),
        let raw = defaults.string(forKey: storageKey),
        let data = raw.data(using: .utf8)
    else { return nil }
    return try? JSONDecoder().decode(WidgetSnapshotPayload.self, from: data)
}

// MARK: - Timeline Entry

struct EuricioEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshotPayload?
}

// MARK: - Timeline Provider

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> EuricioEntry {
        EuricioEntry(date: Date(), snapshot: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (EuricioEntry) -> Void) {
        completion(EuricioEntry(date: Date(), snapshot: loadSnapshot()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<EuricioEntry>) -> Void) {
        let now = Date()
        let entry = EuricioEntry(date: now, snapshot: loadSnapshot())
        // Refresh every 20 min — the app also forces a reload on foreground/busy/interaction.
        let next = Calendar.current.date(byAdding: .minute, value: 20, to: now) ?? now.addingTimeInterval(1200)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

// MARK: - Helpers

private func formatTime(_ isoString: String) -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    var date = formatter.date(from: isoString)
    if date == nil {
        formatter.formatOptions = [.withInternetDateTime]
        date = formatter.date(from: isoString)
    }
    guard let d = date else { return "—" }
    let df = DateFormatter()
    df.locale = Locale.current
    df.dateFormat = "HH:mm"
    return df.string(from: d)
}

// MARK: - View

struct EuricioNextCallWidgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        ZStack {
            Color("$widgetBackground")
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Image(systemName: entry.snapshot?.isBusy == true ? "moon.fill" : "phone.fill")
                        .font(.caption2)
                        .foregroundColor(Color("$accent"))
                    Text(entry.snapshot?.isBusy == true ? "Fokus aktiv" : "Nächster Call")
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundColor(.white.opacity(0.85))
                    Spacer()
                }

                if let snap = entry.snapshot {
                    if let nextCall = snap.nextCall {
                        Text(formatTime(nextCall.when))
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .lineLimit(1)
                        Text(nextCall.entityName ?? nextCall.title ?? "—")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.9))
                            .lineLimit(1)
                    } else {
                        Text("Keine Calls")
                            .font(.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                        Text("in den nächsten 24 h")
                            .font(.caption2)
                            .foregroundColor(.white.opacity(0.75))
                    }

                    Spacer(minLength: 0)

                    HStack(spacing: 10) {
                        Label("\(snap.openTasksCount)", systemImage: "checkmark.circle")
                            .font(.caption2)
                            .foregroundColor(.white.opacity(0.9))
                        Label("\(snap.openCallbacksCount)", systemImage: "arrow.uturn.backward.circle")
                            .font(.caption2)
                            .foregroundColor(.white.opacity(0.9))
                    }
                } else {
                    Spacer()
                    Text("Öffne Euricio")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.8))
                }
            }
            .padding(12)
        }
        .widgetURL(URL(string: entry.snapshot?.nextCall.flatMap { $0.entityId }.map { "euricio://call/\($0)" } ?? "euricio://tasks"))
    }
}

// MARK: - Widget

@main
struct EuricioNextCallWidget: Widget {
    let kind: String = "EuricioNextCallWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                EuricioNextCallWidgetEntryView(entry: entry)
                    .containerBackground(Color("$widgetBackground"), for: .widget)
            } else {
                EuricioNextCallWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("Euricio · Next Call")
        .description("Nächster Call, offene Aufgaben und Fokus-Status auf einen Blick.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
