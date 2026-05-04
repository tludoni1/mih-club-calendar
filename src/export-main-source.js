import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const CONFIG = {
  sourceUrl: "https://app.myice.hockey/clubschedulepublic.php?cid=88&lid=1",
  apiUrl: "https://app.myice.hockey/inc/processclubplanningpublic.php",
  sourceType: "public_club_schedule_api",
  clubId: "88",
  languageId: "1",
  timezone: "Europe/Zurich",
  outputFile: "data/main-source.xml",

  // Aus dem öffentlichen Source Code:
  // minDate='2025-05-04'
  // maxDate='2027-05-04'
  startDate: "2025-05-04",
  endDate: "2027-05-04",

  // Null bedeutet: nicht auf eine Altersgruppe einschränken.
  // Für U18-U21 wäre es "144".
  ageGroupId: null
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

function formatDateSwiss(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${day}.${month}.${year}`;
}

function addMonths(dateString, months) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

function getMonthlyRanges(startDate, endDate) {
  const ranges = [];
  let currentStart = startDate;

  while (currentStart <= endDate) {
    let currentEnd = addMonths(currentStart, 1);
    currentEnd = addDays(currentEnd, -1);

    if (currentEnd > endDate) {
      currentEnd = endDate;
    }

    ranges.push({
      start: currentStart,
      end: currentEnd
    });

    currentStart = addDays(currentEnd, 1);
  }

  return ranges;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
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

function stableJson(value) {
  return JSON.stringify(value ?? {}, Object.keys(value ?? {}).sort());
}

function generateUid(event) {
  const sourceId = pick(event, ["id", "id_event", "event_id"]);

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

function collectEventsFromJson(json) {
  if (Array.isArray(json)) return json;

  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.events)) return json.events;
  if (Array.isArray(json?.items)) return json.items;

  return [];
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
    "id_agegroup"
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
    event: pick(raw, ["event", "event_name", "name"]),
    title: pick(raw, ["title", "name", "event"]),

    agegroup: pick(raw, ["agegroup", "agegroup_name", "agegroup_label"]),
    agegroup_id: agegroupId,

    team: pick(raw, ["team_name", "team_label"]),
    team_id: teamId,

    practice_group: pick(raw, [
      "practice_group",
      "practice_group_name",
      "pgroup_name"
    ]),
    practice_group_id: practiceGroupId,

    category: pick(raw, ["category", "category_name"]),
    category_id: categoryId,

    type: pick(raw, ["type", "type_name"]),
    type_id: pick(raw, ["type_type", "type_id", "id_type"]),

    opponent: pick(raw, ["opponent"]),

    date,
    time_start: timeStart,
    time_end: timeEnd,
    datetime_start: buildDateTime(date, timeStart),
    datetime_end: buildDateTime(date, timeEnd),

    place: pick(raw, ["place", "location"]),
    location_id: pick(raw, ["id_location", "location_id"]),

    notes: pick(raw, ["notes"]),
    description: pick(raw, ["description"]),

    url: pick(raw, ["url", "link"]),

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
<calendar source_url="${escapeXml(CONFIG.sourceUrl)}" api_url="${escapeXml(CONFIG.apiUrl)}" source_type="${escapeXml(CONFIG.sourceType)}" club_id="${escapeXml(CONFIG.clubId)}" language_id="${escapeXml(CONFIG.languageId)}" exported_at="${escapeXml(exportedAt)}" start_date="${escapeXml(CONFIG.startDate)}" end_date="${escapeXml(CONFIG.endDate)}" event_count="${events.length}">
  <events>
${events.map(eventToXml).join("\n")}
  </events>
</calendar>
`;
}

async function fetchEventsForRange(range) {
  const body = new URLSearchParams();

  body.set("type", "filtermypublic");
  body.set("typeagegroup[]", "*");
  body.set("typeevent[]", "*");
  body.set("typetype[]", "*");
  body.set("start", formatDateSwiss(range.start));
  body.set("end", formatDateSwiss(range.end));
  body.set("club", CONFIG.clubId);
  body.set("lang", CONFIG.languageId);
  body.set("location[]", "*");

  if (CONFIG.ageGroupId) {
    body.set("ag", CONFIG.ageGroupId);
  }

  const response = await fetch(CONFIG.apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with": "XMLHttpRequest",
      "referer": CONFIG.sourceUrl
    },
    body
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();

  try {
    const json = JSON.parse(text);
    return collectEventsFromJson(json);
  } catch {
    throw new Error(`API response was not JSON. First 300 characters: ${text.slice(0, 300)}`);
  }
}

function deduplicateEvents(events) {
  const seen = new Set();
  const result = [];

  for (const event of events) {
    const key =
      event.id ||
      `${event.date}|${event.time_start}|${event.time_end}|${event.title}|${event.place}`;

    if (seen.has(key)) continue;

    seen.add(key);
    result.push(event);
  }

  return result;
}

async function main() {
  console.log("Starting My Ice Hockey calendar export...");
  console.log(`API: ${CONFIG.apiUrl}`);
  console.log(`Range: ${CONFIG.startDate} to ${CONFIG.endDate}`);

  const ranges = getMonthlyRanges(CONFIG.startDate, CONFIG.endDate);

  const rawEvents = [];

  for (const range of ranges) {
    console.log(`Fetching ${range.start} to ${range.end}...`);
    const rangeEvents = await fetchEventsForRange(range);
    console.log(`  Found ${rangeEvents.length} events`);
    rawEvents.push(...rangeEvents);
  }

  const normalizedEvents = deduplicateEvents(
    rawEvents.map(normalizeEvent)
  ).sort((a, b) => {
    const aKey = `${a.date} ${a.time_start} ${a.title}`;
    const bKey = `${b.date} ${b.time_start} ${b.title}`;
    return aKey.localeCompare(bKey);
  });

  const xml = buildXml(normalizedEvents);

  ensureDirectoryExists(CONFIG.outputFile);
  fs.writeFileSync(CONFIG.outputFile, xml, "utf8");

  console.log(`Exported unique events: ${normalizedEvents.length}`);
  console.log(`Written file: ${CONFIG.outputFile}`);
}

main().catch((error) => {
  console.error("Export failed:");
  console.error(error);
  process.exit(1);
});
