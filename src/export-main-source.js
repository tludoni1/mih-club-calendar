import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { chromium } from "playwright";

const CONFIG = {
  sourceUrl: "https://app.myice.hockey/clubschedulepublic.php?cid=88&lid=1",
  sourceType: "public_club_schedule",
  clubId: "88",
  languageId: "1",
  timezone: "Europe/Zurich",
  outputFile: "data/main-source.xml"
};

function ensureDirectoryExists(filePath) {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function stableJson(value) {
  return JSON.stringify(value ?? {}, Object.keys(value ?? {}).sort());
}

function generateUid(event) {
  const sourceId =
    event.id ||
    event.id_event ||
    event.event_id ||
    event.uid ||
    "";

  const basis = sourceId
    ? `mih-${CONFIG.clubId}-${sourceId}`
    : stableJson(event);

  const hash = crypto
    .createHash("sha256")
    .update(basis)
    .digest("hex")
    .slice(0, 24);

  return `mih-${CONFIG.clubId}-${hash}@ehc-sursee.local`;
}

function normalizeDate(value) {
  if (!value) return "";

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const swissDate = text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (swissDate) {
    return `${swissDate[3]}-${swissDate[2]}-${swissDate[1]}`;
  }

  return text;
}

function normalizeTime(value) {
  if (!value) return "";

  const text = String(value).trim();

  const match = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return text;

  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function buildDateTime(date, time) {
  if (!date || !time) return "";

  const normalizedDate = normalizeDate(date);
  const normalizedTime = normalizeTime(time);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) return "";
  if (!/^\d{2}:\d{2}$/.test(normalizedTime)) return "";

  return `${normalizedDate}T${normalizedTime}:00+02:00`;
}

function pick(raw, keys) {
  for (const key of keys) {
    if (raw && raw[key] !== undefined && raw[key] !== null && raw[key] !== "") {
      return raw[key];
    }
  }

  return "";
}

function normalizeEvent(raw) {
  const typeEvent = pick(raw, [
    "type_event",
    "event_type",
    "typeevent"
  ]);

  const sourceId = pick(raw, [
    "id",
    "id_event",
    "event_id"
  ]);

  const agegroupId = pick(raw, [
    "type_agegroup",
    "agegroup_id",
    "id_agegroup",
    "agegroup"
  ]);

  const teamId = pick(raw, [
    "team",
    "team_id",
    "id_team"
  ]);

  const practiceGroupId = pick(raw, [
    "pgroup",
    "practice_group_id",
    "id_pgroup"
  ]);

  const categoryId = pick(raw, [
    "id_category",
    "category_id"
  ]) || teamId || practiceGroupId;

  const eventName = pick(raw, [
    "event",
    "event_name",
    "name"
  ]);

  const title = pick(raw, [
    "title",
    "name",
    "event"
  ]);

  const type = pick(raw, [
    "type",
    "type_name"
  ]);

  const typeId = pick(raw, [
    "type_type",
    "type_id",
    "id_type"
  ]);

  const date = normalizeDate(pick(raw, [
    "date",
    "start_date"
  ]));

  const timeStart = normalizeTime(pick(raw, [
    "time_start",
    "start_time"
  ]));

  const timeEnd = normalizeTime(pick(raw, [
    "time_end",
    "end_time"
  ]));

  return {
    id: sourceId,
    uid: generateUid(raw),

    type_event: typeEvent,
    event: eventName,
    title,

    agegroup: pick(raw, [
      "agegroup_name",
      "agegroup_label"
    ]),
    agegroup_id: agegroupId,

    team: pick(raw, [
      "team_name",
      "team_label"
    ]),
    team_id: teamId,

    practice_group: pick(raw, [
      "practice_group",
      "practice_group_name",
      "pgroup_name"
    ]),
    practice_group_id: practiceGroupId,

    category: pick(raw, [
      "category",
      "category_name"
    ]),
    category_id: categoryId,

    type,
    type_id: typeId,

    opponent: pick(raw, [
      "opponent"
    ]),

    date,
    time_start: timeStart,
    time_end: timeEnd,
    datetime_start: buildDateTime(date, timeStart),
    datetime_end: buildDateTime(date, timeEnd),

    place: pick(raw, [
      "place",
      "location"
    ]),
    location_id: pick(raw, [
      "id_location",
      "location_id"
    ]),

    notes: pick(raw, [
      "notes"
    ]),
    description: pick(raw, [
      "description"
    ]),

    url: pick(raw, [
      "url",
      "link"
    ]),

    raw
  };
}

function sourceFieldsToXml(raw) {
  if (!raw || typeof raw !== "object") return "";

  return Object.entries(raw)
    .map(([key, value]) => {
      const safeValue =
        typeof value === "object"
          ? JSON.stringify(value)
          : String(value ?? "");

      return `      <field name="${escapeXml(key)}">${escapeXml(safeValue)}</field>`;
    })
    .join("\n");
}

function eventToXml(event) {
  return `    <event>
      <id>${escapeXml(event.id)}</id>
      <uid>${escapeXml(event.uid)}</uid>

      <type_event>${escapeXml(event.type_event)}</type_event>
      <event>${escapeXml(event.event)}</event>
      <title>${escapeXml(event.title)}</title>

      <agegroup>${escapeXml(event.agegroup)}</agegroup>
      <agegroup_id>${escapeXml(event.agegroup_id)}</agegroup_id>

      <team>${escapeXml(event.team)}</team>
      <team_id>${escapeXml(event.team_id)}</team_id>

      <practice_group>${escapeXml(event.practice_group)}</practice_group>
      <practice_group_id>${escapeXml(event.practice_group_id)}</practice_group_id>

      <category>${escapeXml(event.category)}</category>
      <category_id>${escapeXml(event.category_id)}</category_id>

      <type>${escapeXml(event.type)}</type>
      <type_id>${escapeXml(event.type_id)}</type_id>

      <opponent>${escapeXml(event.opponent)}</opponent>

      <date>${escapeXml(event.date)}</date>
      <time_start>${escapeXml(event.time_start)}</time_start>
      <time_end>${escapeXml(event.time_end)}</time_end>
      <datetime_start>${escapeXml(event.datetime_start)}</datetime_start>
      <datetime_end>${escapeXml(event.datetime_end)}</datetime_end>

      <place>${escapeXml(event.place)}</place>
      <location_id>${escapeXml(event.location_id)}</location_id>

      <notes>${escapeXml(event.notes)}</notes>
      <description>${escapeXml(event.description)}</description>

      <url>${escapeXml(event.url)}</url>

      <source_fields>
${sourceFieldsToXml(event.raw)}
      </source_fields>

      <raw>
        <raw_json>${escapeXml(JSON.stringify(event.raw ?? {}))}</raw_json>
      </raw>
    </event>`;
}

function buildXml(events) {
  const exportedAt = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<calendar source_url="${escapeXml(CONFIG.sourceUrl)}" source_type="${escapeXml(CONFIG.sourceType)}" club_id="${escapeXml(CONFIG.clubId)}" language_id="${escapeXml(CONFIG.languageId)}" exported_at="${escapeXml(exportedAt)}" event_count="${events.length}">
  <events>
${events.map(eventToXml).join("\n")}
  </events>
</calendar>
`;
}

function collectEventsFromJson(json) {
  if (Array.isArray(json)) return json;

  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.events)) return json.events;
  if (Array.isArray(json?.items)) return json.items;

  return [];
}

async function scrapeCalendar() {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  const rawEvents = [];

  page.on("response", async (response) => {
    const responseUrl = response.url();
    const contentType = response.headers()["content-type"] || "";

    const looksRelevant =
      responseUrl.includes("clubschedule") ||
      responseUrl.includes("calendar") ||
      responseUrl.includes("planning") ||
      responseUrl.includes("processclubplanning");

    if (!looksRelevant) return;

    try {
      if (
        contentType.includes("application/json") ||
        contentType.includes("text/json") ||
        contentType.includes("text/html") ||
        contentType === ""
      ) {
        const text = await response.text();

        if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) {
          return;
        }

        const json = JSON.parse(text);
        rawEvents.push(...collectEventsFromJson(json));
      }
    } catch {
      // Some relevant requests may not be JSON. Ignore them.
    }
  });

  await page.goto(CONFIG.sourceUrl, {
    waitUntil: "networkidle",
    timeout: 60000
  });

  await page.waitForTimeout(3000);

  await browser.close();

  return rawEvents;
}

async function main() {
  console.log("Starting My Ice Hockey calendar export...");
  console.log(`Source: ${CONFIG.sourceUrl}`);

  const rawEvents = await scrapeCalendar();

  const normalizedEvents = rawEvents
    .map(normalizeEvent)
    .sort((a, b) => {
      const aKey = `${a.date} ${a.time_start} ${a.title}`;
      const bKey = `${b.date} ${b.time_start} ${b.title}`;
      return aKey.localeCompare(bKey);
    });

  const xml = buildXml(normalizedEvents);

  ensureDirectoryExists(CONFIG.outputFile);
  fs.writeFileSync(CONFIG.outputFile, xml, "utf8");

  console.log(`Exported events: ${normalizedEvents.length}`);
  console.log(`Written file: ${CONFIG.outputFile}`);
}

main().catch((error) => {
  console.error("Export failed:");
  console.error(error);
  process.exit(1);
});
