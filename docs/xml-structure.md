# XML Structure

This document defines the structure of the generated main source XML.

The purpose of the XML is to store all available calendar information from the EHC Sursee My Ice Hockey club calendar in a normalized, searchable and reusable format.

The XML is the central data source for later scripts, for example:

- HTML list or calendar views
- Team-specific views
- Training-group-specific views
- iCalendar / ICS feeds
- filtered XML exports

## Main XML file

The generated file is stored here:

```text
data/main-source.xml
```

## Source

Initial public source URL:

```text
https://app.myice.hockey/clubschedulepublic.php?cid=88&lid=1
```

Current public API endpoint used by the export script:

```text
https://app.myice.hockey/inc/processclubplanningpublic.php
```

Known fixed values:

| Name | Value | Meaning |
|---|---:|---|
| `club_id` | `88` | EHC Sursee club ID in My Ice Hockey |
| `language_id` | `1` | German |
| `source_type` | `public_club_schedule_api` | Public club calendar API source |
| `timezone` | `Europe/Zurich` | Default timezone for local event times |

## Design goals

The XML must follow these principles:

1. Preserve all available source information.
2. Normalize important fields for later filtering.
3. Keep the original raw event data.
4. Avoid losing unknown or future fields.
5. Be readable by simple XML parsers.
6. Be stable enough for later HTML and iCalendar generation.
7. Support new teams and training groups even if they are not yet known in the mapping table.

## Root element

The XML root element is:

```xml
<calendar>
```

Example:

```xml
<calendar
  source_url="https://app.myice.hockey/clubschedulepublic.php?cid=88&amp;lid=1"
  api_url="https://app.myice.hockey/inc/processclubplanningpublic.php"
  source_type="public_club_schedule_api"
  club_id="88"
  language_id="1"
  exported_at="2026-05-04T12:00:00.000Z"
  start_date="2025-05-04"
  end_date="2027-05-04"
  event_count="223">
</calendar>
```

### Root attributes

| Attribute | Required | Description |
|---|---:|---|
| `source_url` | yes | Original public calendar URL |
| `api_url` | yes | Public API endpoint used for the export |
| `source_type` | yes | Internal source type name |
| `club_id` | yes | My Ice Hockey club ID |
| `language_id` | yes | Language ID |
| `exported_at` | yes | Export timestamp in ISO 8601 UTC format |
| `start_date` | yes | First date requested by the export |
| `end_date` | yes | Last date requested by the export |
| `event_count` | yes | Number of exported unique events |

## Events container

All events are stored inside:

```xml
<events>
</events>
```

Example:

```xml
<calendar ...>
  <events>
    <event>
      ...
    </event>
  </events>
</calendar>
```

## Event element

Each calendar entry is stored as:

```xml
<event>
```

Each event contains:

1. Normalized fields
2. Mapping status
3. Original source fields
4. Original raw JSON

## Normalized event fields

The following fields should exist for every event, even if the value is empty.

```xml
<event>
  <id></id>
  <uid></uid>

  <type_event></type_event>
  <event></event>
  <title></title>

  <agegroup></agegroup>
  <agegroup_id></agegroup_id>

  <team></team>
  <team_id></team_id>

  <practice_group></practice_group>
  <practice_group_id></practice_group_id>

  <category></category>
  <category_id></category_id>
  <mapping_status></mapping_status>

  <type></type>
  <type_id></type_id>

  <opponent></opponent>

  <date></date>
  <weekday></weekday>
  <time_start></time_start>
  <time_end></time_end>
  <datetime_start></datetime_start>
  <datetime_end></datetime_end>

  <place></place>
  <location_id></location_id>

  <notes></notes>
  <description></description>

  <url></url>

  <source_fields>
    <field name=""></field>
  </source_fields>

  <raw>
    <raw_json></raw_json>
  </raw>
</event>
```

## Field definitions

| Field | Description |
|---|---|
| `id` | Source event ID, if available |
| `uid` | Stable generated UID for later iCalendar use |
| `type_event` | Source event category, for example `P`, `GH`, or `GA` |
| `event` | Source event label, for example `Training` |
| `title` | Normalized display title |
| `agegroup` | Age group name, for example `U18-U21` |
| `agegroup_id` | My Ice Hockey age group ID if known |
| `team` | Team name for game events if known |
| `team_id` | My Ice Hockey team ID if known |
| `practice_group` | Training group name for training events if known |
| `practice_group_id` | My Ice Hockey practice group ID if known |
| `category` | Generic normalized group/category name |
| `category_id` | Generic normalized group/category ID |
| `mapping_status` | Indicates whether the source group ID could be mapped |
| `type` | Event type name, for example `Eistraining` or `Saison` |
| `type_id` | Event type ID, for example `P2` or `G3` |
| `opponent` | Opponent for game events |
| `date` | Event date in `YYYY-MM-DD` format if available |
| `weekday` | Weekday from source if available, for example `Mo` |
| `time_start` | Start time in `HH:mm` format if available |
| `time_end` | End time in `HH:mm` format if available |
| `datetime_start` | Combined start datetime in ISO 8601 format if available |
| `datetime_end` | Combined end datetime in ISO 8601 format if available |
| `place` | Location name |
| `location_id` | Location ID if known |
| `notes` | Public notes |
| `description` | Longer description, if available |
| `url` | Detail URL if available |

## Mapping status

The export script may enrich events with known age group, team, training group and location information.

The API remains the source of truth. Mapping is only an enrichment layer.

Possible values:

| Value | Meaning |
|---|---|
| `mapped` | The source group ID was recognized and mapped |
| `unknown_group_id` | The source group ID exists but is not yet known in the mapping table |
| `no_group_id` | The event does not contain a usable group ID |
| `not_applicable` | Mapping is not applicable for this event |

Important rule:

Unknown IDs must not be discarded.

If a new team or training group appears, the XML should preserve the source group ID even if the mapping table does not know its name yet.

Example for an unknown group:

```xml
<practice_group></practice_group>
<practice_group_id>99999</practice_group_id>
<category></category>
<category_id>99999</category_id>
<mapping_status>unknown_group_id</mapping_status>
```

## Raw source data

Each event must also contain the original raw source data.

```xml
<raw>
  <raw_json></raw_json>
</raw>
```

The `raw_json` field stores the original JSON object as escaped text.

This is important because My Ice Hockey may provide fields that are not yet normalized. Keeping the raw JSON prevents data loss.

Example:

```xml
<raw>
  <raw_json>{&quot;id_event&quot;:&quot;123&quot;,&quot;id_group&quot;:&quot;14239&quot;}</raw_json>
</raw>
```

## Source fields

Each event should also contain a readable list of the original source fields:

```xml
<source_fields>
  <field name="id_event">123</field>
  <field name="id_group">14239</field>
  <field name="agegroup">U18-U21 (U18)</field>
</source_fields>
```

This allows later scripts and humans to inspect source values without decoding `raw_json`.

## Source group concept

The public My Ice Hockey API currently provides a generic source field:

```text
id_group
```

This field can represent different things depending on the event type.

Current interpretation:

| `type_event` | Meaning of `id_group` |
|---|---|
| `P` | Training group ID |
| `GH` | Team ID |
| `GA` | Team ID |
| other / unknown | Generic group/category ID |

The export script should therefore map `id_group` conditionally:

| Event type | Normalized field |
|---|---|
| Training | `practice_group_id` |
| Home game | `team_id` |
| Away game | `team_id` |
| Unknown | `category_id` |

## Event type concept

Known event identifiers from the inspected source code:

| Source value | Meaning |
|---|---|
| `P` | Training |
| `GH` | Home game |
| `GA` | Away game |

The raw source value must always be preserved.

## Training type values

Known training type identifiers:

| Source value | Meaning |
|---|---|
| `P1` | Trockentraining |
| `P2` | Eistraining |
| `P3` | Krafttraining |
| `P4` | Team Event |
| `P5` | Theorie |
| `P6` | Spezial |
| `P7` | Import |

## Game type values

Known game type identifiers:

| Source value | Meaning |
|---|---|
| `G1` | Freundschaft |
| `G2` | Turnier |
| `G3` | Saison |
| `G4` | Play-Off |
| `G5` | Play-Out |
| `G6` | 1. Phase |
| `G7` | 2. Phase |
| `G8` | Event |
| `G9` | Keine |

## Known age groups

| Age group | ID |
|---|---:|
| Aktiv | `63` |
| Erfassungsstufe | `74` |
| U14-U16 | `143` |
| U18-U21 | `144` |

## Known training groups

| Age group ID | Age group | Training group | `practice_group_id` |
|---:|---|---|---:|
| `63` | Aktiv | 1. Mannschaft | `15268` |
| `63` | Aktiv | 2. Mannschaft | `15269` |
| `63` | Aktiv | Damen | `15270` |
| `63` | Aktiv | Senioren | `15271` |
| `74` | Erfassungsstufe | U12 | `14189` |
| `74` | Erfassungsstufe | U09 | `14190` |
| `74` | Erfassungsstufe | U07 Sommertraining | `14235` |
| `74` | Erfassungsstufe | U09 Sommertraining | `14236` |
| `74` | Erfassungsstufe | U11 Sommertraining | `14237` |
| `143` | U14-U16 | U14 | `14191` |
| `143` | U14-U16 | U16 | `14192` |
| `143` | U14-U16 | U14+U16 | `14193` |
| `143` | U14-U16 | Morgentraining | `14194` |
| `143` | U14-U16 | U14 Sommertraining | `14238` |
| `143` | U14-U16 | Torhüter (jüngere) | `14330` |
| `143` | U14-U16 | Torhüter (ältere) | `14331` |
| `144` | U18-U21 | U18 | `14239` |
| `144` | U18-U21 | U21 | `14240` |

## Known game teams

| Age group ID | Age group | Team | `team_id` |
|---:|---|---|---:|
| `63` | Aktiv | 1. Mannschaft | `10780` |
| `63` | Aktiv | 2. Mannschaft | `10781` |
| `63` | Aktiv | Damen | `10782` |
| `63` | Aktiv | Senioren | `10783` |
| `74` | Erfassungsstufe | U09-1 | `10318` |
| `74` | Erfassungsstufe | U09-2 | `10319` |
| `74` | Erfassungsstufe | U12-1 | `10321` |
| `74` | Erfassungsstufe | U12-2 | `10322` |
| `74` | Erfassungsstufe | U12-3 | `10323` |
| `143` | U14-U16 | U14-A | `10325` |
| `143` | U14-U16 | U14-Top | `10324` |
| `143` | U14-U16 | U16-A I | `10326` |
| `143` | U14-U16 | U16-A II | `10327` |
| `144` | U18-U21 | U18-A | `10328` |
| `144` | U18-U21 | U21-A | `10329` |

## Known locations

| Location | `location_id` |
|---|---:|
| Eishalle Sursee - Kraftraum | `2293` |
| Eishalle Sursee - Tribüne | `2294` |
| Eishalle Sursee - Eisfeld | `2297` |
| Turnhalle Neufeld - Turnhalle | `2298` |
| Turnhalle St. Georg - Turnhalle | `2299` |

## Example training event

```xml
<event>
  <id>751394</id>
  <uid>mih-88-example@ehc-sursee.local</uid>

  <type_event>P</type_event>
  <event>Training</event>
  <title>Training</title>

  <agegroup>U14-U16</agegroup>
  <agegroup_id>143</agegroup_id>

  <team></team>
  <team_id></team_id>

  <practice_group>U16</practice_group>
  <practice_group_id>14192</practice_group_id>

  <category>U16</category>
  <category_id>14192</category_id>
  <mapping_status>mapped</mapping_status>

  <type>Trockentraining</type>
  <type_id>P1</type_id>

  <opponent></opponent>

  <date>2026-05-04</date>
  <weekday>Mo</weekday>
  <time_start>18:30</time_start>
  <time_end>19:45</time_end>
  <datetime_start>2026-05-04T18:30:00+02:00</datetime_start>
  <datetime_end>2026-05-04T19:45:00+02:00</datetime_end>

  <place>Eishalle Sursee - Kraftraum</place>
  <location_id>2293</location_id>

  <notes></notes>
  <description></description>

  <url></url>

  <source_fields>
    <field name="id_event">751394</field>
    <field name="id_group">14192</field>
  </source_fields>

  <raw>
    <raw_json>{}</raw_json>
  </raw>
</event>
```

## Example game event

```xml
<event>
  <id>123456</id>
  <uid>mih-88-example-game@ehc-sursee.local</uid>

  <type_event>GH</type_event>
  <event>Heimspiel</event>
  <title>Heimspiel</title>

  <agegroup>U18-U21</agegroup>
  <agegroup_id>144</agegroup_id>

  <team>U18-A</team>
  <team_id>10328</team_id>

  <practice_group></practice_group>
  <practice_group_id></practice_group_id>

  <category>U18-A</category>
  <category_id>10328</category_id>
  <mapping_status>mapped</mapping_status>

  <type>Saison</type>
  <type_id>G3</type_id>

  <opponent>Example HC</opponent>

  <date>2026-09-20</date>
  <weekday>So</weekday>
  <time_start>17:00</time_start>
  <time_end>19:00</time_end>
  <datetime_start>2026-09-20T17:00:00+02:00</datetime_start>
  <datetime_end>2026-09-20T19:00:00+02:00</datetime_end>

  <place>Eishalle Sursee - Eisfeld</place>
  <location_id>2297</location_id>

  <notes></notes>
  <description></description>

  <url></url>

  <source_fields>
    <field name="id_event">123456</field>
    <field name="id_group">10328</field>
  </source_fields>

  <raw>
    <raw_json>{}</raw_json>
  </raw>
</event>
```

## Empty values

Empty source values must be represented as empty XML elements, not omitted.

Correct:

```xml
<opponent></opponent>
```

Avoid:

```xml
<!-- missing opponent element -->
```

This keeps the XML stable for later consumers.

## Character escaping

All XML values must be escaped.

Required escaping:

| Character | XML escaped value |
|---|---|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&apos;` |

## Timezone

The default timezone for interpreted local event times is:

```text
Europe/Zurich
```

If the source does not provide timezone information, generated `datetime_start` and `datetime_end` should use `Europe/Zurich`.

## Update frequency

The XML should be regenerated twice per day by GitHub Actions.

Current planned update times:

```text
08:30 Switzerland local time
15:00 Switzerland local time
```

GitHub Actions cron expressions run in UTC. The workflow must account for this.

## Request behavior

The export should avoid unnecessary load on My Ice Hockey.

Rules:

1. Use the public API endpoint directly.
2. Do not use personal coach or player calendar links.
3. Do not use login credentials.
4. Do not send requests in parallel.
5. Wait briefly between monthly API requests.
6. Commit the XML only if the generated content changed.

## Data protection note

The XML should initially be generated from the public club calendar only.

No personal coach or player calendar link should be used.

Personal user IDs such as coach `uid` values must not be required for this main source export.

## Later HTML filter examples

Possible filter parameters for later HTML output:

```text
agegroup_id=144
practice_group_id=14239
team_id=10328
```

Possible U18 combined filter:

```text
agegroup_id=144
practice_group_id=14239
team_id=10328
```

The later HTML script should include an event if at least one configured group ID matches:

- training event: `practice_group_id`
- game event: `team_id`

## Later iCalendar filter examples

Possible filter parameters for later iCalendar output:

```text
/team/u18.ics
/team/u21.ics
/group/14239.ics
/agegroup/144.ics
```

The iCalendar script should use:

- `uid`
- `datetime_start`
- `datetime_end`
- `title`
- `place`
- `description`
- `url`
