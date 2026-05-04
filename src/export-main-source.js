import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const PRACTICE_GROUPS = {
  "15268": { agegroup_id: "63", agegroup: "Aktiv", name: "1. Mannschaft" },
  "15269": { agegroup_id: "63", agegroup: "Aktiv", name: "2. Mannschaft" },
  "15270": { agegroup_id: "63", agegroup: "Aktiv", name: "Damen" },
  "15271": { agegroup_id: "63", agegroup: "Aktiv", name: "Senioren" },

  "14189": { agegroup_id: "74", agegroup: "Erfassungsstufe", name: "U12" },
  "14190": { agegroup_id: "74", agegroup: "Erfassungsstufe", name: "U09" },
  "14235": { agegroup_id: "74", agegroup: "Erfassungsstufe", name: "U07 Sommertraining" },
  "14236": { agegroup_id: "74", agegroup: "Erfassungsstufe", name: "U09 Sommertraining" },
  "14237": { agegroup_id: "74", agegroup: "Erfassungsstufe", name: "U11 Sommertraining" },

  "14191": { agegroup_id: "143", agegroup: "U14-U16", name: "U14" },
  "14192": { agegroup_id: "143", agegroup: "U14-U16", name: "U16" },
  "14193": { agegroup_id: "143", agegroup: "U14-U16", name: "U14+U16" },
  "14194": { agegroup_id: "143", agegroup: "U14-U16", name: "Morgentraining" },
  "14238": { agegroup_id: "143", agegroup: "U14-U16", name: "U14 Sommertraining" },
  "14330": { agegroup_id: "143", agegroup: "U14-U16", name: "Torhüter (jüngere)" },
  "14331": { agegroup_id: "143", agegroup: "U14-U16", name: "Torhüter (ältere)" },

  "14239": { agegroup_id: "144", agegroup: "U18-U21", name: "U18" },
  "14240": { agegroup_id: "144", agegroup: "U18-U21", name: "U21" }
};

const TEAMS = {
  "10780": { agegroup_id: "63", agegroup: "Aktiv", name: "1. Mannschaft" },
  "10781": { agegroup_id: "63", agegroup: "Aktiv", name: "2. Mannschaft" },
  "10782": { agegroup_id: "63", agegroup: "Aktiv", name: "Damen" },
  "10783": { agegroup_id: "63", agegroup: "Aktiv", name: "Senioren" },

  "10318": { agegroup_id: "74", agegroup: "Erfassungsstufe", name: "U09-1" },
  "10319": { agegroup_id: "74", agegroup: "Erfassungsstufe", name: "U09-2" },
  "10321": { agegroup_id: "74", agegroup: "Erfassungsstufe", name: "U12-1" },
  "10322": { agegroup_id: "74", agegroup: "Erfassungsstufe", name: "U12-2" },
  "10323": { agegroup_id: "74", agegroup: "Erfassungsstufe", name: "U12-3" },

  "10325": { agegroup_id: "143", agegroup: "U14-U16", name: "U14-A" },
  "10324": { agegroup_id: "143", agegroup: "U14-U16", name: "U14-Top" },
  "10326": { agegroup_id: "143", agegroup: "U14-U16", name: "U16-A I" },
  "10327": { agegroup_id: "143", agegroup: "U14-U16", name: "U16-A II" },

  "10328": { agegroup_id: "144", agegroup: "U18-U21", name: "U18-A" },
  "10329": { agegroup_id: "144", agegroup: "U18-U21", name: "U21-A" }
};

const LOCATIONS = {
  "Eishalle Sursee - Kraftraum": "2293",
  "Eishalle Sursee - Tribüne": "2294",
  "Eishalle Sursee - Eisfeld": "2297",
  "Turnhalle Neufeld - Turnhalle": "2298",
  "Turnhalle St. Georg - Turnhalle": "2299"
};

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

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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

function resolveGroupMapping(raw, typeEvent) {
  const sourceGroupId = String(pick(raw, ["id_group", "group_id", "id_category", "category_id"]) || "");

  if (!sourceGroupId) {
    return {
      agegroup: pick(raw, ["agegroup", "agegroup_name", "agegroup_label"]),
      agegroup_id: "",
      team: "",
      team_id: "",
      practice_group: "",
      practice_group_id: "",
      category: "",
      category_id: "",
      mapping_status: "no_group_id"
    };
  }

  if (typeEvent === "P") {
    const mappedPracticeGroup = PRACTICE_GROUPS[sourceGroupId];

    if (mappedPracticeGroup) {
      return {
        agegroup: mappedPracticeGroup.agegroup,
        agegroup_id: mappedPracticeGroup.agegroup_id,
        team: "",
        team_id: "",
        practice_group: mappedPracticeGroup.name,
        practice_group_id: sourceGroupId,
        category: mappedPracticeGroup.name,
        category_id: sourceGroupId,
        mapping_status: "mapped"
      };
    }

    return {
      agegroup: pick(raw, ["agegroup", "agegroup_name", "agegroup_label"]),
      agegroup_id: "",
      team: "",
      team_id: "",
      practice_group: "",
      practice_group_id: sourceGroupId,
      category: "",
      category_id: sourceGroupId,
      mapping_status: "unknown_group_id"
    };
  }

  if (typeEvent === "GH" || typeEvent === "GA") {
    const mappedTeam = TEAMS[sourceGroupId];

    if (mappedTeam) {
      return {
        agegroup: mappedTeam.agegroup,
        agegroup_id: mappedTeam.agegroup_id,
        team: mappedTeam.name,
        team_id: sourceGroupId,
        practice_group: "",
        practice_group_id: "",
        category: mappedTeam.name,
        category_id: sourceGroupId,
        mapping_status: "mapped"
      };
    }

    return {
      agegroup: pick(raw, ["agegroup", "agegroup_name", "agegroup_label"]),
      agegroup_id: "",
      team: "",
      team_id: sourceGroupId,
      practice_group: "",
      practice_group_id: "",
      category: "",
      category_id: sourceGroupId,
      mapping_status: "unknown_group_id"
    };
  }

  return {
    agegroup: pick(raw, ["agegroup", "agegroup_name", "agegroup_label"]),
    agegroup_id: "",
    team: "",
    team_id: "",
    practice_group: "",
    practice_group_id: "",
    category: "",
    category_id: sourceGroupId,
    mapping_status: "not_applicable"
  };
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

  const groupMapping = resolveGroupMapping(raw, typeEvent);

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

  const place = pick(raw, ["place", "location"]);

  return {
    id: sourceId,
    uid: generateUid(raw),

    type_event: typeEvent,
    event: pick(raw, ["event", "event_name", "name"]),
    title: pick(raw, ["title", "name", "event"]),

    agegroup: groupMapping.agegroup,
    agegroup_id: groupMapping.agegroup_id,

    team: groupMapping.team,
    team_id: groupMapping.team_id,

    practice_group: groupMapping.practice_group,
    practice_group_id: groupMapping.practice_group_id,

    category: groupMapping.category,
    category_id: groupMapping.category_id,
    mapping_status: groupMapping.mapping_status,

    type: pick(raw, ["type", "type_name"]),
    type_id: pick(raw, ["type_type", "type_id", "id_type"]),

    opponent: pick(raw, ["opponent"]),

    date,
    weekday: pick(raw, ["weekday"]),

    time_start: timeStart,
    time_end: timeEnd,
    datetime_start: buildDateTime(date, timeStart),
    datetime_end: buildDateTime(date, timeEnd),

    place,
    location_id: pick(raw, ["id_location", "location_id"]) || LOCATIONS[place] || "",

    notes: String(pick(raw, ["notes"])).trim(),
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

      <mapping_status>${escapeXml(event.mapping_status)}</mapping_status>

      <type>${escapeXml(event.type)}</type>
      <type_id>${escapeXml(event.type_id)}</type_id>

      <opponent>${escapeXml(event.opponent)}</opponent>

      <date>${escapeXml(event.date)}</date>
      <weekday>${escapeXml(event.weekday)}</weekday>
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

  await sleep(1000);
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
